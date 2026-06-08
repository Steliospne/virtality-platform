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
  useBucketObjectReferences,
  useMoveBucketObject,
} from '@virtality/react-query'
import {
  buildRenameDestinationObjectKey,
  getBucketObjectParentPrefix,
  type BucketObjectRow,
} from '@virtality/shared/utils'
import { useEffect, useMemo, useState } from 'react'
import { BucketReferencedObjectWarning } from './bucket-referenced-object-warning'

type BucketObjectRenameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  object: BucketObjectRow | null
  onRenamed?: () => void
}

export function BucketObjectRenameDialog({
  open,
  onOpenChange,
  object,
  onRenamed,
}: BucketObjectRenameDialogProps) {
  const [newFilename, setNewFilename] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const referencesQuery = useBucketObjectReferences(
    open && object ? object.objectKey : null,
  )

  const moveMutation = useMoveBucketObject({
    onSuccess: (outcome) => {
      setSuccessMessage(`Renamed to ${outcome.destinationObjectKey}`)
      onRenamed?.()
    },
  })

  useEffect(() => {
    if (!open || !object) {
      return
    }

    setNewFilename(object.name)
    setValidationError(null)
    setSuccessMessage(null)
    moveMutation.reset()
  }, [object, open])

  const destinationObjectKey = useMemo(() => {
    if (!object) {
      return null
    }

    try {
      return buildRenameDestinationObjectKey(object.objectKey, newFilename)
    } catch (error) {
      return null
    }
  }, [newFilename, object])

  const destinationError = useMemo(() => {
    if (!object || !newFilename.trim()) {
      return 'Enter a new filename.'
    }

    try {
      buildRenameDestinationObjectKey(object.objectKey, newFilename)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid filename.'
    }
  }, [newFilename, object])

  const parentPrefix = object ? getBucketObjectParentPrefix(object.objectKey) : ''

  const canSubmit =
    Boolean(object) &&
    !destinationError &&
    destinationObjectKey !== object?.objectKey &&
    !moveMutation.isPending &&
    !successMessage

  const handleRename = async () => {
    if (!object || destinationError || !destinationObjectKey) {
      setValidationError(destinationError ?? 'Invalid rename target.')
      return
    }

    setValidationError(null)

    try {
      await moveMutation.mutateAsync({
        sourceObjectKey: object.objectKey,
        destinationObjectKey,
      })
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Rename failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Rename bucket object</DialogTitle>
        </DialogHeader>

        {object ? (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='bucket-rename-filename'>New filename</Label>
              <Input
                id='bucket-rename-filename'
                value={newFilename}
                onChange={(event) => setNewFilename(event.target.value)}
                disabled={moveMutation.isPending || Boolean(successMessage)}
              />
              <p className='text-xs text-zinc-500'>
                Renames within {parentPrefix || 'the bucket root'}.
              </p>
              {destinationError ? (
                <p className='text-sm text-red-500'>{destinationError}</p>
              ) : null}
            </div>

            <BucketReferencedObjectWarning
              references={referencesQuery.data?.references ?? []}
              operation='rename'
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
            disabled={moveMutation.isPending}
          >
            {successMessage ? 'Close' : 'Cancel'}
          </Button>
          {!successMessage ? (
            <Button onClick={handleRename} disabled={!canSubmit}>
              {moveMutation.isPending ? <Spinner /> : 'Rename'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
