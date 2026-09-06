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
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { useAssignPermanentAccessGate } from '@virtality/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatAssignPermanentAccessGateSuccessMessage } from '@/lib/access-gate-actions'
import {
  formatMutationErrorMessage,
  TESTER_RECIPIENT_DIALOG_NOTE,
} from '@/lib/admin-customer-actions'

type CustomerProfileAssignPermanentAccessGateDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  testerRecipient: boolean
}

export function CustomerProfileAssignPermanentAccessGateDialog({
  userId,
  open,
  onOpenChange,
  testerRecipient,
}: CustomerProfileAssignPermanentAccessGateDialogProps) {
  const { mutate, isPending } = useAssignPermanentAccessGate()
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const canSubmit = reason.trim().length >= 3 && confirmed && !isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      { userId, reason: reason.trim() },
      {
        onSuccess: (result) => {
          toast.success(formatAssignPermanentAccessGateSuccessMessage(result))
          setReason('')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(
              error,
              'Failed to assign permanent Access Gate',
            ),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign permanent Access Gate</DialogTitle>
            <DialogDescription>
              Sets or creates a permanent Access Gate row with no trial clock.
              This is bookkeeping only and does not unlock VR program launch.
              {testerRecipient ? TESTER_RECIPIENT_DIALOG_NOTE : null}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='assign-access-gate-reason'>Reason</Label>
              <Input
                id='assign-access-gate-reason'
                className='mt-1'
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder='Support note for the audit trail'
              />
            </div>
            <label className='flex items-start gap-2 text-sm'>
              <input
                type='checkbox'
                className='mt-1'
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                I confirm this customer should receive a permanent Access Gate
                and understand this does not grant VR access.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isPending ? 'Assigning...' : 'Assign permanent gate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
