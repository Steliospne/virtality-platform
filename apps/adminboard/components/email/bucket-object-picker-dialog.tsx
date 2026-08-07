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
import { Badge } from '@virtality/ui/components/badge'
import {
  filterBucketImagePickerFolders,
  filterBucketImagePickerObjects,
} from '@/lib/bucket-image-picker'
import { filterBucketMp4PickerObjects } from '@/lib/promo-video'
import { cn } from '@/lib/utils'
import { BucketVideoPreview } from '@/components/bucket/bucket-video-preview'
import { useBucket } from '@virtality/react-query'
import {
  getBucketBreadcrumbs,
  shouldBypassVercelImageOptimization,
} from '@virtality/shared/utils'
import { Check, ChevronRight, Folder } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

export type BucketObjectPickerKind = 'image' | 'mp4'

type BucketObjectPickerDialogBaseProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectKind?: BucketObjectPickerKind
  disabledObjectKeys?: ReadonlySet<string> | readonly string[]
  disabledReason?: string
}

type BucketObjectPickerDialogSingleProps = BucketObjectPickerDialogBaseProps & {
  selectionMode?: 'single'
  onSelect: (objectKey: string) => void
  onConfirm?: never
}

type BucketObjectPickerDialogMultipleProps =
  BucketObjectPickerDialogBaseProps & {
    selectionMode: 'multiple'
    onSelect?: never
    onConfirm: (objectKeys: string[]) => void
  }

export type BucketObjectPickerDialogProps =
  | BucketObjectPickerDialogSingleProps
  | BucketObjectPickerDialogMultipleProps

const pickerRowClassName =
  'hover:bg-accent flex w-full items-center gap-3 rounded-lg border p-3 text-left'

function toDisabledKeySet(
  disabledObjectKeys: BucketObjectPickerDialogBaseProps['disabledObjectKeys'],
): ReadonlySet<string> {
  if (!disabledObjectKeys) {
    return new Set()
  }

  return disabledObjectKeys instanceof Set
    ? disabledObjectKeys
    : new Set(disabledObjectKeys)
}

export const BucketObjectPickerDialog = (
  props: BucketObjectPickerDialogProps,
) => {
  const {
    open,
    onOpenChange,
    objectKind = 'image',
    disabledObjectKeys,
    disabledReason = 'Unavailable',
    selectionMode = 'single',
  } = props
  const isMultiple = selectionMode === 'multiple'
  const [query, setQuery] = useState('')
  const [prefix, setPrefix] = useState('')
  const [selectedObjectKeys, setSelectedObjectKeys] = useState<string[]>([])
  const { data, isLoading } = useBucket({ prefix })
  const disabledKeySet = useMemo(
    () => toDisabledKeySet(disabledObjectKeys),
    [disabledObjectKeys],
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      setPrefix('')
      setSelectedObjectKeys([])
    }
  }, [open])

  const breadcrumbs = useMemo(() => getBucketBreadcrumbs(prefix), [prefix])

  const folders = useMemo(
    () => filterBucketImagePickerFolders(data?.folders ?? [], query),
    [data?.folders, query],
  )

  const selectableObjects = useMemo(() => {
    const objects = data?.objects ?? []
    if (objectKind === 'mp4') {
      return filterBucketMp4PickerObjects(objects, query)
    }

    return filterBucketImagePickerObjects(objects, query)
  }, [data?.objects, objectKind, query])

  const hasResults = folders.length > 0 || selectableObjects.length > 0
  const emptyLabel =
    objectKind === 'mp4'
      ? 'No folders or MP4 objects found in this location.'
      : 'No folders or image objects found in this location.'
  const title =
    objectKind === 'mp4' ? 'Select bucket video' : 'Select bucket image'
  const description =
    objectKind === 'mp4'
      ? 'Browse folders in the platform media bucket and choose an MP4 video. External URLs are not supported.'
      : isMultiple
        ? 'Browse folders in the platform media bucket and choose one or more images. External URLs are not supported.'
        : 'Browse folders in the platform media bucket and choose an image. External URLs are not supported.'

  const toggleObjectKey = (objectKey: string) => {
    setSelectedObjectKeys((current) => {
      if (current.includes(objectKey)) {
        return current.filter((key) => key !== objectKey)
      }

      return [...current, objectKey]
    })
  }

  const handleObjectClick = (objectKey: string) => {
    if (disabledKeySet.has(objectKey)) {
      return
    }

    if (isMultiple) {
      toggleObjectKey(objectKey)
      return
    }

    props.onSelect?.(objectKey)
    onOpenChange(false)
  }

  const handleConfirm = () => {
    if (!isMultiple || selectedObjectKeys.length === 0) {
      return
    }

    props.onConfirm?.(selectedObjectKeys)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] max-w-2xl overflow-hidden'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            <p className='text-muted-foreground text-sm'>{emptyLabel}</p>
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

              {selectableObjects.map((object) => {
                const isDisabled = disabledKeySet.has(object.objectKey)
                const isSelected = selectedObjectKeys.includes(object.objectKey)

                return (
                  <button
                    key={object.objectKey}
                    type='button'
                    disabled={isDisabled}
                    aria-pressed={isMultiple ? isSelected : undefined}
                    onClick={() => handleObjectClick(object.objectKey)}
                    className={cn(
                      pickerRowClassName,
                      isSelected &&
                        'border-primary bg-primary/5 ring-primary ring-1',
                      isDisabled && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {objectKind === 'mp4' ? (
                      <BucketVideoPreview
                        src={object.cdnUrl}
                        label={object.name}
                        className='rounded'
                        fallbackClassName='bg-muted rounded'
                        iconClassName='text-muted-foreground size-6'
                      />
                    ) : (
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
                    )}
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium'>{object.name}</p>
                      <p className='text-muted-foreground truncate font-mono text-xs'>
                        {object.objectKey}
                      </p>
                    </div>
                    {isDisabled ? (
                      <Badge variant='secondary' className='shrink-0 text-xs'>
                        {disabledReason}
                      </Badge>
                    ) : null}
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
                {selectedObjectKeys.length} selected
              </p>
              {selectedObjectKeys.length > 0 ? (
                <Button
                  variant='outline'
                  onClick={() => setSelectedObjectKeys([])}
                >
                  Clear
                </Button>
              ) : null}
              <Button
                variant='primary'
                disabled={selectedObjectKeys.length === 0}
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
