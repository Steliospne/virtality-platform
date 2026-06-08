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
  useReplaceBucketObject,
} from '@virtality/react-query'
import {
  type BucketObjectRow,
  type BucketReplaceOutcome,
} from '@virtality/shared/utils'
import { Copy, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BucketReferencedObjectWarning } from './bucket-referenced-object-warning'

type BucketObjectReplaceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  object: BucketObjectRow | null
  onReplaced?: () => void
}

function ReplaceResultRow({ outcome }: { outcome: BucketReplaceOutcome }) {
  const copyCdnUrl = () => {
    void navigator.clipboard.writeText(outcome.newCdnUrl)
  }

  return (
    <div className='flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800'>
      <div className='min-w-0'>
        <p className='text-sm font-medium'>Replacement uploaded</p>
        <p className='truncate font-mono text-xs text-zinc-500'>
          {outcome.newObjectKey}
        </p>
      </div>
      <Button size='sm' variant='outline' onClick={copyCdnUrl}>
        <Copy />
        Copy new CDN URL
      </Button>
      <p className='text-xs text-zinc-500'>
        {outcome.oldObjectDeleted
          ? 'The previous object was deleted from storage.'
          : 'The previous object was kept in storage.'}
      </p>
    </div>
  )
}

export function BucketObjectReplaceDialog({
  open,
  onOpenChange,
  object,
  onReplaced,
}: BucketObjectReplaceDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteOldObject, setDeleteOldObject] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [replaceOutcome, setReplaceOutcome] = useState<BucketReplaceOutcome | null>(
    null,
  )

  const referencesQuery = useBucketObjectReferences(
    open && object ? object.objectKey : null,
  )

  const replaceMutation = useReplaceBucketObject({
    onSuccess: (outcome) => {
      setReplaceOutcome(outcome)
      onReplaced?.()
    },
  })

  useEffect(() => {
    if (!open || !object) {
      return
    }

    setSelectedFile(null)
    setDeleteOldObject(false)
    setValidationError(null)
    setReplaceOutcome(null)
    replaceMutation.reset()
  }, [object, open])

  const canSubmit =
    selectedFile !== null &&
    !replaceMutation.isPending &&
    replaceOutcome === null

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setValidationError(null)
    setReplaceOutcome(null)
    replaceMutation.reset()
  }

  const handleReplace = async () => {
    if (!object || !selectedFile) {
      setValidationError('Select a replacement file.')
      return
    }

    setValidationError(null)

    try {
      await replaceMutation.mutateAsync({
        sourceObjectKey: object.objectKey,
        file: selectedFile,
        deleteOldObject,
      })
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Replacement failed.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Replace bucket object</DialogTitle>
        </DialogHeader>

        {object ? (
          <div className='flex flex-col gap-4'>
            <p className='text-sm text-zinc-600 dark:text-zinc-300'>
              Upload replacement content as a new unique bucket object. The
              existing CDN URL will not be overwritten.
            </p>

            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>{object.name}</p>
              <p className='font-mono text-xs text-zinc-500'>{object.objectKey}</p>
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor='bucket-replace-file'>Replacement file</Label>
              <Input
                id='bucket-replace-file'
                type='file'
                onChange={handleFileChange}
                disabled={replaceMutation.isPending || replaceOutcome !== null}
              />
            </div>

            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={deleteOldObject}
                onChange={(event) => setDeleteOldObject(event.target.checked)}
                disabled={replaceMutation.isPending || replaceOutcome !== null}
              />
              Delete the previous object after the replacement upload succeeds
            </label>

            <BucketReferencedObjectWarning
              references={referencesQuery.data?.references ?? []}
              operation='replace'
              deleteOldObject={deleteOldObject}
            />

            {validationError ? (
              <p className='text-sm text-red-500'>{validationError}</p>
            ) : null}

            {replaceOutcome ? (
              <ReplaceResultRow outcome={replaceOutcome} />
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={replaceMutation.isPending}
          >
            {replaceOutcome ? 'Close' : 'Cancel'}
          </Button>
          {!replaceOutcome ? (
            <Button onClick={handleReplace} disabled={!canSubmit}>
              {replaceMutation.isPending ? <Spinner /> : <RefreshCw />}
              Replace content
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
