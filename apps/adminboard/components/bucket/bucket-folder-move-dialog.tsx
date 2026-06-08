'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@virtality/ui/components/label'
import { Input } from '@virtality/ui/components/input'
import { Spinner } from '@virtality/ui/components/spinner'
import {
  useBucketFolderPreview,
  useMoveBucketFolder,
} from '@virtality/react-query'
import {
  type BucketFolderRow,
  normalizeBucketPrefix,
  validateBucketTargetPrefix,
} from '@virtality/shared/utils'
import { useEffect, useMemo, useState } from 'react'
import { BucketFolderOperationSummary } from './bucket-folder-operation-summary'
import { BucketFolderReferencedObjectsWarning } from './bucket-folder-referenced-objects-warning'

type BucketFolderMoveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: BucketFolderRow | null
  onMoved?: () => void
}

export function BucketFolderMoveDialog({
  open,
  onOpenChange,
  folder,
  onMoved,
}: BucketFolderMoveDialogProps) {
  const [destinationPrefix, setDestinationPrefix] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [operationOutcome, setOperationOutcome] = useState<
    Awaited<ReturnType<ReturnType<typeof useMoveBucketFolder>['mutateAsync']>> | null
  >(null)

  const previewQuery = useBucketFolderPreview(
    open && folder ? folder.prefix : null,
  )

  const moveMutation = useMoveBucketFolder({
    onSuccess: (outcome) => {
      setOperationOutcome(outcome)
      onMoved?.()
    },
  })

  useEffect(() => {
    if (!open || !folder) {
      return
    }

    setDestinationPrefix(folder.prefix)
    setValidationError(null)
    setOperationOutcome(null)
    moveMutation.reset()
  }, [folder, open])

  const destinationError = useMemo(() => {
    if (!destinationPrefix.trim()) {
      return 'Enter a destination folder prefix.'
    }

    return validateBucketTargetPrefix(destinationPrefix.replace(/\/$/, ''))
  }, [destinationPrefix])

  const normalizedDestination = normalizeBucketPrefix(destinationPrefix)
  const canSubmit =
    Boolean(folder) &&
    !destinationError &&
    folder?.prefix !== normalizedDestination &&
    !moveMutation.isPending &&
    !operationOutcome &&
    !previewQuery.isLoading

  const handleMove = async () => {
    if (!folder || destinationError) {
      setValidationError(destinationError ?? 'Invalid destination folder prefix.')
      return
    }

    setValidationError(null)

    try {
      await moveMutation.mutateAsync({
        sourcePrefix: folder.prefix,
        destinationPrefix: normalizedDestination,
      })
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Folder move failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Move folder</DialogTitle>
        </DialogHeader>

        {folder ? (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>Source folder prefix</p>
              <p className='font-mono text-xs text-zinc-500'>{folder.prefix}</p>
            </div>

            {previewQuery.isLoading ? (
              <Spinner />
            ) : (
              <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                {previewQuery.data?.objectCount ?? 0} bucket object
                {(previewQuery.data?.objectCount ?? 0) === 1 ? '' : 's'} will be
                moved.
              </p>
            )}

            <div className='flex flex-col gap-2'>
              <Label htmlFor='bucket-folder-move-destination'>
                Destination folder prefix
              </Label>
              <Input
                id='bucket-folder-move-destination'
                value={destinationPrefix}
                onChange={(event) => setDestinationPrefix(event.target.value)}
                disabled={moveMutation.isPending || Boolean(operationOutcome)}
              />
              <p className='text-xs text-zinc-500'>
                Enter the full destination folder prefix, including a trailing
                slash when moving into a nested location.
              </p>
              {destinationError ? (
                <p className='text-sm text-red-500'>{destinationError}</p>
              ) : null}
            </div>

            <BucketFolderReferencedObjectsWarning
              referencedObjects={previewQuery.data?.referencedObjects ?? []}
              operation='move'
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
            disabled={moveMutation.isPending}
          >
            {operationOutcome ? 'Close' : 'Cancel'}
          </Button>
          {!operationOutcome ? (
            <Button onClick={handleMove} disabled={!canSubmit}>
              {moveMutation.isPending ? <Spinner /> : 'Move folder'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
