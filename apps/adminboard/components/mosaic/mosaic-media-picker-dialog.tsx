'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@virtality/ui/components/input'
import {
  filterMosaicMediaPickerFolders,
  filterMosaicMediaPickerObjects,
  inferMosaicMediaKindFromContentType,
} from '@/lib/mosaic-media-picker'
import { BucketVideoPreview } from '@/components/bucket/bucket-video-preview'
import { cn } from '@/lib/utils'
import { useBucket } from '@virtality/react-query'
import type { MosaicMediaKind } from '@virtality/shared/types'
import {
  getBucketBreadcrumbs,
  shouldBypassVercelImageOptimization,
} from '@virtality/shared/utils'
import { Check, ChevronRight, Folder } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

export type MosaicMediaSelection = {
  objectKey: string
  mediaKind: MosaicMediaKind
}

type MosaicMediaPickerDialogBaseProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type MosaicMediaPickerDialogSingleProps = MosaicMediaPickerDialogBaseProps & {
  selectionMode?: 'single'
  onSelect: (selection: MosaicMediaSelection) => void
  onConfirm?: never
}

type MosaicMediaPickerDialogMultipleProps = MosaicMediaPickerDialogBaseProps & {
  selectionMode: 'multiple'
  onSelect?: never
  onConfirm: (selections: MosaicMediaSelection[]) => void
}

export type MosaicMediaPickerDialogProps =
  | MosaicMediaPickerDialogSingleProps
  | MosaicMediaPickerDialogMultipleProps

const pickerRowClassName =
  'hover:bg-accent flex w-full items-center gap-3 rounded-lg border p-3 text-left'

export const MosaicMediaPickerDialog = (
  props: MosaicMediaPickerDialogProps,
) => {
  const { open, onOpenChange, selectionMode = 'single' } = props
  const isMultiple = selectionMode === 'multiple'
  const [query, setQuery] = useState('')
  const [prefix, setPrefix] = useState('')
  const [selectedSelections, setSelectedSelections] = useState<
    MosaicMediaSelection[]
  >([])
  const { data, isLoading } = useBucket({ prefix })

  useEffect(() => {
    if (!open) {
      setQuery('')
      setPrefix('')
      setSelectedSelections([])
    }
  }, [open])

  const breadcrumbs = useMemo(() => getBucketBreadcrumbs(prefix), [prefix])

  const folders = useMemo(
    () => filterMosaicMediaPickerFolders(data?.folders ?? [], query),
    [data?.folders, query],
  )

  const mediaObjects = useMemo(
    () => filterMosaicMediaPickerObjects(data?.objects ?? [], query),
    [data?.objects, query],
  )

  const hasResults = folders.length > 0 || mediaObjects.length > 0
  const selectedKeySet = useMemo(
    () => new Set(selectedSelections.map((selection) => selection.objectKey)),
    [selectedSelections],
  )

  const toggleSelection = (selection: MosaicMediaSelection) => {
    setSelectedSelections((current) => {
      if (current.some((item) => item.objectKey === selection.objectKey)) {
        return current.filter((item) => item.objectKey !== selection.objectKey)
      }

      return [...current, selection]
    })
  }

  const handleObjectClick = (selection: MosaicMediaSelection) => {
    if (isMultiple) {
      toggleSelection(selection)
      return
    }

    props.onSelect?.(selection)
    onOpenChange(false)
  }

  const handleConfirm = () => {
    if (!isMultiple || selectedSelections.length === 0) {
      return
    }

    props.onConfirm?.(selectedSelections)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] max-w-2xl overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Select bucket media</DialogTitle>
          <DialogDescription>
            {isMultiple
              ? 'Browse folders in the platform media bucket and choose one or more images or videos for the mosaic tray. External URLs are not supported.'
              : 'Browse folders in the platform media bucket and choose an image or video for the mosaic tray. External URLs are not supported.'}
          </DialogDescription>
        </DialogHeader>

        <nav
          aria-label='Bucket breadcrumbs'
          className='flex flex-wrap items-center gap-1 text-sm'
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1

            return (
              <div key={crumb.prefix} className='flex items-center gap-1'>
                {index > 0 && (
                  <ChevronRight
                    className='text-muted-foreground size-4'
                    aria-hidden='true'
                  />
                )}
                <button
                  type='button'
                  className={
                    isLast
                      ? 'font-medium'
                      : 'text-muted-foreground hover:underline'
                  }
                  onClick={() => setPrefix(crumb.prefix)}
                  disabled={isLast}
                >
                  {crumb.label}
                </button>
              </div>
            )
          })}
        </nav>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Search in this folder'
        />

        <div className='max-h-[50vh] space-y-2 overflow-y-auto'>
          {isLoading ? (
            <p className='text-muted-foreground text-sm'>
              Loading bucket objects...
            </p>
          ) : !hasResults ? (
            <p className='text-muted-foreground text-sm'>
              No folders or supported media objects found in this location.
            </p>
          ) : (
            <>
              {folders.map((folder) => (
                <button
                  key={folder.prefix}
                  type='button'
                  onClick={() => setPrefix(folder.prefix)}
                  className={pickerRowClassName}
                >
                  <Folder
                    className='size-12 text-amber-500'
                    aria-hidden='true'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium'>{folder.name}</p>
                    <p className='text-muted-foreground truncate font-mono text-xs'>
                      {folder.prefix}
                    </p>
                  </div>
                </button>
              ))}

              {mediaObjects.map((object) => {
                const mediaKind = inferMosaicMediaKindFromContentType(
                  object.contentType,
                )

                if (!mediaKind) {
                  return null
                }

                const selection = {
                  objectKey: object.objectKey,
                  mediaKind,
                }
                const isSelected = selectedKeySet.has(object.objectKey)

                return (
                  <button
                    key={object.objectKey}
                    type='button'
                    aria-pressed={isMultiple ? isSelected : undefined}
                    onClick={() => handleObjectClick(selection)}
                    className={cn(
                      pickerRowClassName,
                      isSelected &&
                        'border-primary bg-primary/5 ring-primary ring-1',
                    )}
                  >
                    {mediaKind === 'image' ? (
                      <Image
                        src={object.cdnUrl}
                        alt={object.name}
                        width={48}
                        height={48}
                        unoptimized={shouldBypassVercelImageOptimization(
                          object.cdnUrl,
                        )}
                        className='size-12 rounded object-cover'
                      />
                    ) : (
                      <BucketVideoPreview
                        src={object.cdnUrl}
                        label={object.name}
                        className='rounded'
                        fallbackClassName='bg-muted rounded'
                        iconClassName='text-muted-foreground size-6'
                      />
                    )}
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium'>{object.name}</p>
                      <p className='text-muted-foreground truncate font-mono text-xs'>
                        {object.objectKey}
                      </p>
                    </div>
                    {isSelected ? (
                      <Check
                        className='text-primary size-5 shrink-0'
                        aria-hidden='true'
                      />
                    ) : null}
                  </button>
                )
              })}
            </>
          )}
        </div>

        <div className='flex items-center justify-end gap-2'>
          {isMultiple ? (
            <>
              <p className='text-muted-foreground mr-auto text-sm'>
                {selectedSelections.length} selected
              </p>
              {selectedSelections.length > 0 ? (
                <Button
                  variant='outline'
                  onClick={() => setSelectedSelections([])}
                >
                  Clear
                </Button>
              ) : null}
              <Button
                variant='primary'
                disabled={selectedSelections.length === 0}
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </>
          ) : null}
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
