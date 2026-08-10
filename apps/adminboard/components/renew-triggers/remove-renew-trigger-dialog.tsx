'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@virtality/ui/components/spinner'
import { getErrorMessage } from '@/lib/get-error-message'
import type {
  RenewTriggerChannel,
  RenewTriggerListItem,
} from '@virtality/shared/types'
import { useRemoveRenewTrigger } from '@virtality/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type RemoveRenewTriggerDialogProps = {
  channel: RenewTriggerChannel
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: RenewTriggerListItem | null
}

export function RemoveRenewTriggerDialog({
  channel,
  open,
  onOpenChange,
  trigger,
}: RemoveRenewTriggerDialogProps) {
  const {
    mutateAsync: removeRenewTrigger,
    isPending,
    reset,
  } = useRemoveRenewTrigger(channel)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setValidationError(null)
    reset()
  }, [open, reset, trigger])

  const handleRemove = async () => {
    if (!trigger) {
      return
    }

    setValidationError(null)

    try {
      await removeRenewTrigger({ id: trigger.id })
      toast.success('Renew trigger removed.')
      onOpenChange(false)
    } catch (error) {
      setValidationError(getErrorMessage(error, 'Remove failed.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Remove renew trigger</DialogTitle>
          <DialogDescription>
            Removing all rows for this channel silences it. There is no separate
            master switch.
          </DialogDescription>
        </DialogHeader>

        {trigger ? (
          <div className='flex flex-col gap-2'>
            <p className='text-sm font-medium'>
              {trigger.daysBefore} day{trigger.daysBefore === 1 ? '' : 's'}{' '}
              before
              {trigger.active ? '' : ' (inactive)'}
            </p>
            {validationError ? (
              <p className='text-sm text-red-500'>{validationError}</p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleRemove}
            disabled={!trigger || isPending}
          >
            {isPending ? <Spinner /> : 'Remove trigger'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
