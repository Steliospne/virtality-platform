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
  useBucketFolderPreview,
  useDeleteBucketFolder,
} from '@virtality/react-query'
import { type BucketFolderRow } from '@virtality/shared/utils'
import { useEffect, useState } from 'react'
import { BucketFolderOperationSummary } from './bucket-folder-operation-summary'
import { BucketFolderReferencedObjectsWarning } from './bucket-folder-referenced-objects-warning'

type BucketFolderDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: BucketFolderRow | null
  onDeleted?: () => void
}

export function BucketFolderDeleteDialog({
  open,
  onOpenChange,
  folder,
  onDeleted,
}: BucketFolderDeleteDialogProps) {
  const [validationError, setValidationError] = useState<string | null>(null)
  const [operationOutcome, setOperationOutcome] = useState<
    Awaited<ReturnType<ReturnType<typeof useDeleteBucketFolder>['mutateAsync']>> | null
  >(null)

  const previewQuery = useBucketFolderPreview(
    open && folder ? folder.prefix : null,
  )

  const deleteMutation = useDeleteBucketFolder({
    onSuccess: (outcome) => {
      setOperationOutcome(outcome)
      onDeleted?.()
    },
  })

  useEffect(() => {
    if (!open || !folder) {
      return
    }

    setValidationError(null)
    setOperationOutcome(null)
    deleteMutation.reset()
  }, [folder, open])

  const handleDelete = async () => {
    if (!folder) {
      return
    }

    setValidationError(null)

    try {
      await deleteMutation.mutateAsync({ sourcePrefix: folder.prefix })
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Folder delete failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Delete folder</DialogTitle>
        </DialogHeader>

        {folder ? (
          <div className='flex flex-col gap-4'>
            <p className='text-sm text-zinc-600 dark:text-zinc-300'>
              Permanently delete every bucket object under this folder prefix?
              This action cannot be undone.
            </p>

            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>{folder.name}</p>
              <p className='font-mono text-xs text-zinc-500'>{folder.prefix}</p>
            </div>

            {previewQuery.isLoading ? (
              <Spinner />
            ) : (
              <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                {previewQuery.data?.objectCount ?? 0} bucket object
                {(previewQuery.data?.objectCount ?? 0) === 1 ? '' : 's'} will be
                deleted.
              </p>
            )}

            <BucketFolderReferencedObjectsWarning
              referencedObjects={previewQuery.data?.referencedObjects ?? []}
              operation='delete'
            />

            {validationError ? (
              <p className='text-sm text-red-500'>{validationError}</p>
            ) : null}

            {operationOutcome ? (
              <BucketFolderOperationSummary outcome={operationOutcome} />
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {operationOutcome ? 'Close' : 'Cancel'}
          </Button>
          {!operationOutcome ? (
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={
                !folder ||
                deleteMutation.isPending ||
                previewQuery.isLoading
              }
            >
              {deleteMutation.isPending ? <Spinner /> : 'Delete permanently'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
