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
import { useBucket } from '@virtality/react-query'
import Image from 'next/image'
import { useMemo, useState } from 'react'

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
  const { data, isLoading } = useBucket({ prefix: '' })

  const imageObjects = useMemo(() => {
    const objects = data?.objects ?? []
    const normalizedQuery = query.trim().toLowerCase()

    return objects
      .filter((object) => object.contentType.startsWith('image/'))
      .filter((object) =>
        normalizedQuery
          ? object.objectKey.toLowerCase().includes(normalizedQuery)
          : true,
      )
  }, [data?.objects, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] max-w-2xl overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Select bucket image</DialogTitle>
          <DialogDescription>
            Choose an image from the platform media bucket. External URLs are not
            supported.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Filter by object key'
        />

        <div className='max-h-[50vh] space-y-2 overflow-y-auto'>
          {isLoading ? (
            <p className='text-muted-foreground text-sm'>Loading bucket objects...</p>
          ) : imageObjects.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No image objects found in the bucket.
            </p>
          ) : (
            imageObjects.map((object) => (
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
                  <p className='truncate font-mono text-xs text-zinc-500'>
                    {object.objectKey}
                  </p>
                </div>
              </button>
            ))
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
