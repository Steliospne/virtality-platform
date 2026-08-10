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
import { Checkbox } from '@/components/ui/checkbox'
import { getErrorMessage } from '@/lib/get-error-message'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import type {
  RenewTriggerChannel,
  RenewTriggerListItem,
} from '@virtality/shared/types'
import {
  useCreateRenewTrigger,
  useUpdateRenewTrigger,
} from '@virtality/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export type RenewTriggerDialogMode = 'create' | 'edit' | null

type RenewTriggerFormDialogProps = {
  channel: RenewTriggerChannel
  trigger: RenewTriggerListItem | null
  mode: RenewTriggerDialogMode
  onClose: () => void
}

export function RenewTriggerFormDialog({
  channel,
  trigger,
  mode,
  onClose,
}: RenewTriggerFormDialogProps) {
  const [daysBefore, setDaysBefore] = useState('7')
  const [active, setActive] = useState(true)
  const { mutate: createRenewTrigger, isPending: isCreating } =
    useCreateRenewTrigger()
  const { mutate: updateRenewTrigger, isPending: isUpdating } =
    useUpdateRenewTrigger()

  const isPending = isCreating || isUpdating
  const open = mode !== null

  useEffect(() => {
    if (!open) {
      return
    }

    if (mode === 'edit' && trigger) {
      setDaysBefore(String(trigger.daysBefore))
      setActive(trigger.active)
      return
    }

    setDaysBefore('7')
    setActive(true)
  }, [mode, open, trigger])

  const parseDaysBefore = () => {
    const parsed = Number.parseInt(daysBefore, 10)
    if (!Number.isInteger(parsed) || parsed < 1) {
      toast.error('Days before must be a positive whole number.')
      return null
    }
    return parsed
  }

  const handleSubmit = () => {
    const parsedDaysBefore = parseDaysBefore()
    if (parsedDaysBefore === null) {
      return
    }

    if (mode === 'create') {
      createRenewTrigger(
        {
          channel,
          daysBefore: parsedDaysBefore,
          active,
        },
        {
          onSuccess: () => {
            toast.success('Renew trigger added.')
            onClose()
          },
          onError: (error: unknown) => {
            toast.error(getErrorMessage(error, 'Failed to add renew trigger.'))
          },
        },
      )
      return
    }

    if (!trigger) {
      return
    }

    updateRenewTrigger(
      {
        id: trigger.id,
        daysBefore: parsedDaysBefore,
        active,
      },
      {
        onSuccess: () => {
          toast.success('Renew trigger updated.')
          onClose()
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Failed to update renew trigger.'))
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit renew trigger' : 'Add renew trigger'}
          </DialogTitle>
          <DialogDescription>
            Set how many days before Entitlement Clock end this channel fires.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='renew-trigger-days-before'>Days before</Label>
            <Input
              id='renew-trigger-days-before'
              type='number'
              min={1}
              step={1}
              value={daysBefore}
              onChange={(event) => setDaysBefore(event.target.value)}
            />
          </div>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={active}
              onCheckedChange={(checked) => setActive(checked === true)}
            />
            Active
          </label>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='primary'
            onClick={handleSubmit}
            disabled={isPending}
          >
            {mode === 'edit' ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
