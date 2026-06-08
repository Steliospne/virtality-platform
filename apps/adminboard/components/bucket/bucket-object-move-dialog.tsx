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
  type BucketObjectRow,
  validateBucketObjectKey,
} from '@virtality/shared/utils'
import { useEffect, useMemo, useState } from 'react'
import { BucketReferencedObjectWarning } from './bucket-referenced-object-warning'

type BucketObjectMoveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  object: BucketObjectRow | null
  onMoved?: () => void
}

export function BucketObjectMoveDialog({
  open,
  onOpenChange,
  object,
  onMoved,
}: BucketObjectMoveDialogProps) {
  const [destinationObjectKey, setDestinationObjectKey] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const referencesQuery = useBucketObjectReferences(
    open && object ? object.objectKey : null,
  )

  const moveMutation = useMoveBucketObject({
    onSuccess: (outcome) => {
      setSuccessMessage(`Moved to ${outcome.destinationObjectKey}`)
      onMoved?.()
    },
  })

  useEffect(() => {
    if (!open || !object) {
      return
    }

    setDestinationObjectKey(object.objectKey)
    setValidationError(null)
    setSuccessMessage(null)
    moveMutation.reset()
  }, [object, open])

  const destinationError = useMemo(() => {
    if (!destinationObjectKey.trim()) {
      return 'Enter a destination object key.'
    }

    return validateBucketObjectKey(destinationObjectKey)
  }, [destinationObjectKey])

  const canSubmit =
    Boolean(object) &&
    !destinationError &&
    destinationObjectKey.trim() !== object?.objectKey &&
    !moveMutation.isPending &&
    !successMessage

  const handleMove = async () => {
    if (!object || destinationError) {
      setValidationError(destinationError ?? 'Invalid destination object key.')
      return
    }

    setValidationError(null)

    try {
      await moveMutation.mutateAsync({
        sourceObjectKey: object.objectKey,
        destinationObjectKey: destinationObjectKey.trim(),
      })
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Move failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Move bucket object</DialogTitle>
        </DialogHeader>

        {object ? (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>Source object key</p>
              <p className='font-mono text-xs text-zinc-500'>{object.objectKey}</p>
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='bucket-move-destination'>
                Destination object key
              </Label>
              <Input
                id='bucket-move-destination'
                value={destinationObjectKey}
                onChange={(event) => setDestinationObjectKey(event.target.value)}
                disabled={moveMutation.isPending || Boolean(successMessage)}
              />
              <p className='text-xs text-zinc-500'>
                Enter the full destination object key, including any target
                folder prefix.
              </p>
              {destinationError ? (
                <p className='text-sm text-red-500'>{destinationError}</p>
              ) : null}
            </div>

            <BucketReferencedObjectWarning
              references={referencesQuery.data?.references ?? []}
              operation='move'
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
            <Button onClick={handleMove} disabled={!canSubmit}>
              {moveMutation.isPending ? <Spinner /> : 'Move'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
