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
  filterBucketImagePickerFolders,
  filterBucketImagePickerObjects,
} from '@/lib/bucket-image-picker'
import { useBucket } from '@virtality/react-query'
import { getBucketBreadcrumbs } from '@virtality/shared/utils'
import { ChevronRight, Folder } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

type BucketObjectPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (objectKey: string) => void
}

export const BucketObjectPickerDialog = ({
  open,
  onOpenChange,
  onSelect,
}: BucketObjectPickerDialogProps) => {
  const [query, setQuery] = useState('')
  const [prefix, setPrefix] = useState('')
  const { data, isLoading } = useBucket({ prefix })

  useEffect(() => {
    if (!open) {
      setQuery('')
      setPrefix('')
    }
  }, [open])

  const breadcrumbs = useMemo(() => getBucketBreadcrumbs(prefix), [prefix])

  const folders = useMemo(
    () => filterBucketImagePickerFolders(data?.folders ?? [], query),
    [data?.folders, query],
  )

  const imageObjects = useMemo(
    () => filterBucketImagePickerObjects(data?.objects ?? [], query),
    [data?.objects, query],
  )

  const hasResults = folders.length > 0 || imageObjects.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] max-w-2xl overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Select bucket image</DialogTitle>
          <DialogDescription>
            Browse folders in the platform media bucket and choose an image.
            External URLs are not supported.
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
                {index > 0 ? (
                  <ChevronRight
                    className='text-muted-foreground size-4'
                    aria-hidden='true'
                  />
                ) : null}
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
            <p className='text-muted-foreground text-sm'>Loading bucket objects...</p>
          ) : !hasResults ? (
            <p className='text-muted-foreground text-sm'>
              No folders or image objects found in this location.
            </p>
          ) : (
            <>
              {folders.map((folder) => (
                <button
                  key={folder.prefix}
                  type='button'
                  onClick={() => setPrefix(folder.prefix)}
                  className='hover:bg-accent flex w-full items-center gap-3 rounded-lg border p-3 text-left'
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

              {imageObjects.map((object) => (
                <button
                  key={object.objectKey}
                  type='button'
                  onClick={() => {
                    onSelect(object.objectKey)
                    onOpenChange(false)
                  }}
                  className='hover:bg-accent flex w-full items-center gap-3 rounded-lg border p-3 text-left'
                >
                  <Image
                    src={object.cdnUrl}
                    alt={object.name}
                    width={48}
                    height={48}
                    className='size-12 rounded object-cover'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium'>{object.name}</p>
                    <p className='text-muted-foreground truncate font-mono text-xs'>
                      {object.objectKey}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        <div className='flex justify-end'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
