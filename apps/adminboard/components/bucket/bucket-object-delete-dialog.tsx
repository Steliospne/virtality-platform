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
import {
  useBucketObjectReferences,
  useDeleteBucketObject,
} from '@virtality/react-query'
import { type BucketObjectRow } from '@virtality/shared/utils'
import { useEffect, useState } from 'react'
import { BucketReferencedObjectWarning } from './bucket-referenced-object-warning'

type BucketObjectDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  object: BucketObjectRow | null
  onDeleted?: () => void
}

export function BucketObjectDeleteDialog({
  open,
  onOpenChange,
  object,
  onDeleted,
}: BucketObjectDeleteDialogProps) {
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const referencesQuery = useBucketObjectReferences(
    open && object ? object.objectKey : null,
  )

  const deleteMutation = useDeleteBucketObject({
    onSuccess: (outcome) => {
      setSuccessMessage(`Deleted ${outcome.objectKey}`)
      onDeleted?.()
    },
  })

  useEffect(() => {
    if (!open || !object) {
      return
    }

    setValidationError(null)
    setSuccessMessage(null)
    deleteMutation.reset()
  }, [object, open])

  const handleDelete = async () => {
    if (!object) {
      return
    }

    setValidationError(null)

    try {
      await deleteMutation.mutateAsync({ objectKey: object.objectKey })
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Delete failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Delete bucket object</DialogTitle>
        </DialogHeader>

        {object ? (
          <div className='flex flex-col gap-4'>
            <p className='text-sm text-zinc-600 dark:text-zinc-300'>
              Permanently delete this bucket object from storage? This action
              cannot be undone.
            </p>

            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>{object.name}</p>
              <p className='font-mono text-xs text-zinc-500'>{object.objectKey}</p>
            </div>

            <BucketReferencedObjectWarning
              references={referencesQuery.data?.references ?? []}
              operation='delete'
            />

            {validationError ? (
              <p className='text-sm text-red-500'>{validationError}</p>
            ) : null}

            {successMessage ? (
              <p className='text-sm text-green-600'>{successMessage}</p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {successMessage ? 'Close' : 'Cancel'}
          </Button>
          {!successMessage ? (
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={!object || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Spinner /> : 'Delete permanently'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
