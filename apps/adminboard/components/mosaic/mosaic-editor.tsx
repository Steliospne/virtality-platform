'use client'

import { Button } from '@/components/ui/button'
import { MosaicAddMediaDialog } from '@/components/mosaic/mosaic-add-media-dialog'
import MosaicBoardEditor from '@/components/mosaic/mosaic-board-editor'
import { MosaicSaveEmptyDialog } from '@/components/mosaic/mosaic-save-empty-dialog'
import MosaicTray from '@/components/mosaic/mosaic-tray'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  addMosaicTrayItem,
  clearMosaicEditorState,
  createEmptyMosaicEditorState,
  mosaicEditorTilesToSaveInput,
  placeMosaicTileFromTray,
  removeMosaicTileFromBoard,
  resizeMosaicTile,
  type MosaicEditorState,
  type MosaicSpan,
  type MosaicTrayItem,
} from '@/lib/mosaic-editor'
import { useSaveMosaic } from '@virtality/react-query'
import { assessMosaicLiveEligibility } from '@virtality/shared/utils'
import { PlusSquare } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const MosaicEditor = () => {
  const [editorState, setEditorState] = useState<MosaicEditorState>(
    createEmptyMosaicEditorState,
  )
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [addMediaOpen, setAddMediaOpen] = useState(false)
  const [emptySaveOpen, setEmptySaveOpen] = useState(false)
  const { mutateAsync: saveMosaic, isPending: isSaving } = useSaveMosaic()

  const handleAddToTray = (items: MosaicTrayItem[]) => {
    if (items.length === 0) {
      return
    }

    setEditorState((current) =>
      items.reduce((state, item) => addMosaicTrayItem(state, item), current),
    )

    if (items.length === 1) {
      toast.success('Media added to the staging tray.')
      return
    }

    toast.success(`${items.length} media items added to the staging tray.`)
  }

  const handlePlaceTile = (trayItemId: string, row: number, col: number) => {
    let isOccupied = false

    setEditorState((current) => {
      const result = placeMosaicTileFromTray(
        current,
        trayItemId,
        row,
        col,
        crypto.randomUUID(),
      )

      if (!result.ok) {
        isOccupied = result.reason === 'occupied'
        return current
      }

      return result.state
    })

    if (isOccupied) {
      toast.error('That cell is already occupied.')
    }
  }

  const handleResizeTile = (tileId: string, span: MosaicSpan) => {
    let resizeFailed = false

    setEditorState((current) => {
      const result = resizeMosaicTile(current, tileId, span)

      if (!result.ok) {
        resizeFailed = true
        return current
      }

      return result.state
    })

    if (resizeFailed) {
      toast.error('That span does not fit from this tile origin.')
    }
  }

  const handleRemoveTile = (tileId: string) => {
    let removed = false

    setEditorState((current) => {
      const next = removeMosaicTileFromBoard(
        current,
        tileId,
        crypto.randomUUID(),
      )

      if (!next) {
        return current
      }

      removed = true
      return next
    })

    if (removed) {
      setSelectedTileId(null)
      toast.success('Tile returned to the staging tray.')
    }
  }

  const handleClear = () => {
    setEditorState(clearMosaicEditorState())
    setSelectedTileId(null)
    toast.message('Editor cleared. The live saved board is unchanged.')
  }

  const persistBoard = async (acknowledgeEmptyHide = false) => {
    try {
      const result = await saveMosaic({
        tiles: mosaicEditorTilesToSaveInput(editorState.tiles),
        acknowledgeEmptyHide,
      })

      if (result.warnings?.length) {
        for (const warning of result.warnings) {
          toast.warning(warning)
        }
      }

      toast.success('Mosaic saved.')
      setEmptySaveOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save the mosaic.'))
    }
  }

  const handleSave = () => {
    const eligibility = assessMosaicLiveEligibility(editorState.tiles)

    switch (eligibility.status) {
      case 'empty':
        setEmptySaveOpen(true)
        break
      case 'incomplete':
        toast.error(
          'Fix gaps or overlaps before saving. See the validation notes below the board.',
        )
        break
      case 'live':
        void persistBoard()
        break
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-muted-foreground max-w-2xl text-sm'>
            Stage bucket media in the tray, drag items onto the board, drag
            tiles back to the tray to remove them, resize into legal spans, then
            save a perfect tiling to publish.
          </p>
        </div>
        <div className='ml-auto flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={handleClear}
            disabled={isSaving}
          >
            Clear editor
          </Button>
          <Button
            type='button'
            variant='default'
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save mosaic'}
          </Button>
          <Button
            variant='primary'
            className='flex items-center'
            onClick={() => setAddMediaOpen(true)}
            disabled={isSaving}
          >
            <PlusSquare />
            Add media
          </Button>
        </div>
      </div>

      <MosaicTray items={editorState.tray} onReturnTile={handleRemoveTile} />

      <MosaicBoardEditor
        tiles={editorState.tiles}
        selectedTileId={selectedTileId}
        onSelectTile={setSelectedTileId}
        onPlaceTile={handlePlaceTile}
        onResizeTile={handleResizeTile}
        onRemoveTile={handleRemoveTile}
      />

      <MosaicAddMediaDialog
        open={addMediaOpen}
        onOpenChange={setAddMediaOpen}
        onAddToTray={handleAddToTray}
      />

      <MosaicSaveEmptyDialog
        open={emptySaveOpen}
        onOpenChange={setEmptySaveOpen}
        isSaving={isSaving}
        onConfirm={() => void persistBoard(true)}
      />
    </div>
  )
}

export default MosaicEditor
