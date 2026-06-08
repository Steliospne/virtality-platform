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
  buildFolderRenameDestinationPrefix,
  type BucketFolderRow,
} from '@virtality/shared/utils'
import { useEffect, useMemo, useState } from 'react'
import { BucketFolderOperationSummary } from './bucket-folder-operation-summary'
import { BucketFolderReferencedObjectsWarning } from './bucket-folder-referenced-objects-warning'

type BucketFolderRenameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: BucketFolderRow | null
  onRenamed?: () => void
}

export function BucketFolderRenameDialog({
  open,
  onOpenChange,
  folder,
  onRenamed,
}: BucketFolderRenameDialogProps) {
  const [newFolderName, setNewFolderName] = useState('')
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
      onRenamed?.()
    },
  })

  useEffect(() => {
    if (!open || !folder) {
      return
    }

    setNewFolderName(folder.name)
    setValidationError(null)
    setOperationOutcome(null)
    moveMutation.reset()
  }, [folder, open])

  const destinationPrefix = useMemo(() => {
    if (!folder) {
      return null
    }

    try {
      return buildFolderRenameDestinationPrefix(folder.prefix, newFolderName)
    } catch {
      return null
    }
  }, [folder, newFolderName])

  const destinationError = useMemo(() => {
    if (!folder || !newFolderName.trim()) {
      return 'Enter a new folder name.'
    }

    try {
      buildFolderRenameDestinationPrefix(folder.prefix, newFolderName)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid folder name.'
    }
  }, [folder, newFolderName])

  const canSubmit =
    Boolean(folder) &&
    !destinationError &&
    destinationPrefix !== folder?.prefix &&
    !moveMutation.isPending &&
    !operationOutcome &&
    !previewQuery.isLoading

  const handleRename = async () => {
    if (!folder || destinationError || !destinationPrefix) {
      setValidationError(destinationError ?? 'Invalid rename target.')
      return
    }

    setValidationError(null)

    try {
      await moveMutation.mutateAsync({
        sourcePrefix: folder.prefix,
        destinationPrefix,
      })
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Folder rename failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
        </DialogHeader>

        {folder ? (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>Current folder prefix</p>
              <p className='font-mono text-xs text-zinc-500'>{folder.prefix}</p>
            </div>

            {previewQuery.isLoading ? (
              <Spinner />
            ) : (
              <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                {previewQuery.data?.objectCount ?? 0} bucket object
                {(previewQuery.data?.objectCount ?? 0) === 1 ? '' : 's'} will be
                renamed with this folder.
              </p>
            )}

            <div className='flex flex-col gap-2'>
              <Label htmlFor='bucket-folder-rename-name'>New folder name</Label>
              <Input
                id='bucket-folder-rename-name'
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                disabled={moveMutation.isPending || Boolean(operationOutcome)}
              />
              {destinationError ? (
                <p className='text-sm text-red-500'>{destinationError}</p>
              ) : null}
            </div>

            <BucketFolderReferencedObjectsWarning
              referencedObjects={previewQuery.data?.referencedObjects ?? []}
              operation='rename'
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
            <Button onClick={handleRename} disabled={!canSubmit}>
              {moveMutation.isPending ? <Spinner /> : 'Rename folder'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
