'use client'

import { Button } from '@/components/ui/button'
import { getMosaicTileGridStyle } from '@/lib/mosaic-grid'
import {
  formatMosaicSpan,
  getEmptyMosaicCells,
  getLegalMosaicSpansForTile,
  mosaicSpansEqual,
  MOSAIC_BOARD_TILE_DRAG_MIME,
  MOSAIC_TRAY_DRAG_MIME,
  type MosaicEditorTile,
  type MosaicSpan,
} from '@/lib/mosaic-editor'
import { BucketVideoPreview } from '@/components/bucket/bucket-video-preview'
import { cn } from '@/lib/utils'
import type { MosaicLiveEligibility } from '@virtality/shared/types'
import {
  assessMosaicLiveEligibility,
  bucketCdnUrl,
  shouldBypassVercelImageOptimization,
} from '@virtality/shared/utils'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'

type MosaicBoardEditorProps = {
  tiles: MosaicEditorTile[]
  selectedTileId: string | null
  onSelectTile: (tileId: string | null) => void
  onPlaceTile: (trayItemId: string, row: number, col: number) => void
  onResizeTile: (tileId: string, span: MosaicSpan) => void
  onRemoveTile: (tileId: string) => void
}

function MosaicEditorValidation({
  eligibility,
}: {
  eligibility: MosaicLiveEligibility
}) {
  switch (eligibility.status) {
    case 'live':
      return (
        <p className='text-sm text-emerald-700 dark:text-emerald-400'>
          Perfect tiling — ready to publish on save.
        </p>
      )
    case 'empty':
      return (
        <p className='text-muted-foreground text-sm'>
          The board is empty. Saving requires an explicit hide warning.
        </p>
      )
    case 'incomplete':
      return (
        <div className='space-y-2'>
          <p className='text-sm font-medium'>
            This board is not a perfect tiling yet:
          </p>
          <ul className='text-muted-foreground list-disc space-y-1 pl-5 text-sm'>
            {eligibility.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )
  }
}

type MosaicPlacedTileProps = {
  tile: MosaicEditorTile
  isSelected: boolean
  onSelect: () => void
}

function MosaicPlacedTile({
  tile,
  isSelected,
  onSelect,
}: MosaicPlacedTileProps) {
  const src = bucketCdnUrl(tile.objectKey)

  return (
    <button
      type='button'
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(MOSAIC_BOARD_TILE_DRAG_MIME, tile.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'relative overflow-hidden rounded-md border bg-zinc-100 text-left dark:bg-zinc-900',
        isSelected
          ? 'ring-primary ring-2 ring-offset-2'
          : 'hover:ring-primary/40 hover:ring-2',
      )}
      style={getMosaicTileGridStyle(tile)}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      aria-pressed={isSelected}
      aria-label={`${tile.alt}, span ${formatMosaicSpan(tile)}. Drag back to the tray to remove.`}
    >
      {tile.mediaKind === 'image' ? (
        <Image
          src={src}
          alt={tile.alt}
          fill
          unoptimized={shouldBypassVercelImageOptimization(src)}
          className='object-cover'
          sizes='(min-width: 768px) 200px, 120px'
        />
      ) : (
        <BucketVideoPreview src={src} label={tile.alt} fill playOnHover />
      )}
    </button>
  )
}

const MosaicBoardEditor = ({
  tiles,
  selectedTileId,
  onSelectTile,
  onPlaceTile,
  onResizeTile,
  onRemoveTile,
}: MosaicBoardEditorProps) => {
  const [activeDropCell, setActiveDropCell] = useState<{
    row: number
    col: number
  } | null>(null)
  const emptyCells = useMemo(() => getEmptyMosaicCells(tiles), [tiles])
  const eligibility = useMemo(() => assessMosaicLiveEligibility(tiles), [tiles])
  const selectedTile = tiles.find((tile) => tile.id === selectedTileId) ?? null
  const legalSpans = useMemo(
    () =>
      selectedTileId ? getLegalMosaicSpansForTile(tiles, selectedTileId) : [],
    [selectedTileId, tiles],
  )

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    row: number,
    col: number,
  ) => {
    if (!event.dataTransfer.types.includes(MOSAIC_TRAY_DRAG_MIME)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setActiveDropCell({ row, col })
  }

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    row: number,
    col: number,
  ) => {
    event.preventDefault()
    setActiveDropCell(null)

    const trayItemId = event.dataTransfer.getData(MOSAIC_TRAY_DRAG_MIME)
    if (!trayItemId) {
      return
    }

    onPlaceTile(trayItemId, row, col)
  }

  return (
    <section className='space-y-3'>
      <div>
        <h2 className='text-sm font-medium'>Board editor</h2>
        <p className='text-muted-foreground text-sm'>
          Drop tray items onto empty cells, or drag board tiles back to the tray
          to remove them. Click a tile to resize. Gaps and validation update
          live below the grid.
        </p>
      </div>

      <div
        className='grid aspect-square w-full max-w-xl grid-cols-3 grid-rows-3 gap-2'
        aria-label='Mosaic board editor'
        onClick={() => onSelectTile(null)}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return
          }
          setActiveDropCell(null)
        }}
      >
        {emptyCells.map(({ row, col }) => {
          const isActive =
            activeDropCell?.row === row && activeDropCell?.col === col

          return (
            <div
              key={`cell-${row}-${col}`}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
              }}
              className={cn(
                'rounded-md border border-dashed',
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'border-amber-300/80 bg-amber-50/40 dark:border-amber-700/80 dark:bg-amber-950/20',
              )}
              onDragOver={(event) => handleDragOver(event, row, col)}
              onDrop={(event) => handleDrop(event, row, col)}
            />
          )
        })}

        {tiles.map((tile) => (
          <MosaicPlacedTile
            key={tile.id}
            tile={tile}
            isSelected={selectedTileId === tile.id}
            onSelect={() =>
              onSelectTile(selectedTileId === tile.id ? null : tile.id)
            }
          />
        ))}
      </div>

      {selectedTile ? (
        <div className='flex flex-wrap items-center gap-3 rounded-lg border p-4'>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>Selected tile</p>
            <p className='text-muted-foreground text-sm'>{selectedTile.alt}</p>
          </div>

          <div className='flex flex-wrap gap-2'>
            {legalSpans.map((span) => {
              const isActive = mosaicSpansEqual(selectedTile, span)

              return (
                <Button
                  key={formatMosaicSpan(span)}
                  type='button'
                  size='sm'
                  variant={isActive ? 'primary' : 'outline'}
                  onClick={() => onResizeTile(selectedTile.id, span)}
                >
                  {formatMosaicSpan(span)}
                </Button>
              )
            })}
          </div>

          <Button
            type='button'
            size='sm'
            variant='destructive'
            className='ml-auto'
            onClick={() => onRemoveTile(selectedTile.id)}
          >
            <Trash2 />
            Remove to tray
          </Button>
        </div>
      ) : null}

      <MosaicEditorValidation eligibility={eligibility} />
    </section>
  )
}

export default MosaicBoardEditor
