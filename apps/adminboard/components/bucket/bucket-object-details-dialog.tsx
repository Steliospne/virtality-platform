'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@virtality/ui/components/spinner'
import { useBucketObjectDetails } from '@virtality/react-query'
import { type BucketObjectRow } from '@virtality/shared/utils'
import { format } from 'date-fns'

type BucketObjectDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  object: BucketObjectRow | null
}

function formatDetailValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function formatDetailDate(value: string | null): string {
  if (!value) {
    return '—'
  }

  return format(new Date(value), 'MMM d, yyyy HH:mm')
}

function formatDetailSize(size: number | null): string {
  if (size === null) {
    return '—'
  }

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className='flex flex-col gap-1'>
      <dt className='text-xs font-medium uppercase tracking-wide text-zinc-500'>
        {label}
      </dt>
      <dd
        className={
          mono
            ? 'break-all font-mono text-xs text-zinc-700 dark:text-zinc-200'
            : 'text-sm text-zinc-900 dark:text-zinc-100'
        }
      >
        {value}
      </dd>
    </div>
  )
}

export function BucketObjectDetailsDialog({
  open,
  onOpenChange,
  object,
}: BucketObjectDetailsDialogProps) {
  const detailsQuery = useBucketObjectDetails(
    open && object ? object.objectKey : null,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Bucket object details</DialogTitle>
        </DialogHeader>

        {object ? (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>{object.name}</p>
              <p className='font-mono text-xs text-zinc-500'>{object.objectKey}</p>
            </div>

            {detailsQuery.isLoading ? (
              <div className='flex justify-center py-6'>
                <Spinner />
              </div>
            ) : null}

            {detailsQuery.error ? (
              <p className='text-sm text-red-500'>
                Failed to load object details.
              </p>
            ) : null}

            {detailsQuery.data ? (
              <dl className='grid gap-4'>
                {!detailsQuery.data.found ? (
                  <p className='text-sm text-amber-700 dark:text-amber-300'>
                    This object was not found in storage. It may have been
                    deleted or moved.
                  </p>
                ) : null}

                <DetailRow
                  label='Stored content type'
                  value={formatDetailValue(detailsQuery.data.storedContentType)}
                />
                <DetailRow
                  label='Inferred content type (listing)'
                  value={detailsQuery.data.inferredContentType}
                />
                <DetailRow
                  label='Size'
                  value={formatDetailSize(detailsQuery.data.size)}
                />
                <DetailRow
                  label='Last modified'
                  value={formatDetailDate(detailsQuery.data.lastModified)}
                />
                <DetailRow
                  label='ETag'
                  value={formatDetailValue(detailsQuery.data.etag)}
                  mono
                />
                <DetailRow label='CDN URL' value={detailsQuery.data.cdnUrl} mono />
              </dl>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
