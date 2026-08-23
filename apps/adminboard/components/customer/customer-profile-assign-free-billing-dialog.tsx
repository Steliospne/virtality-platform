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
import { useAssignFreeAfterCancellation } from '@virtality/react-query'
import { buildAssignFreeAfterCancellationPreview } from '@virtality/shared/utils'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  formatBillingMutationSuccessMessage,
  formatMutationErrorMessage,
} from '@/lib/admin-customer-actions'

const ASSIGN_FREE_AFTER_CANCELLATION_PREVIEW =
  buildAssignFreeAfterCancellationPreview()

type CustomerProfileAssignFreeBillingDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileAssignFreeBillingDialog({
  userId,
  open,
  onOpenChange,
}: CustomerProfileAssignFreeBillingDialogProps) {
  const { mutate, isPending } = useAssignFreeAfterCancellation()
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const canSubmit = reason.trim().length >= 3 && confirmed && !isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      {
        userId,
        reason: reason.trim(),
      },
      {
        onSuccess: (result) => {
          toast.success(formatBillingMutationSuccessMessage(result))
          setReason('')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(
              error,
              'Failed to assign Free after cancellation',
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
            <DialogTitle>Assign Free after cancellation</DialogTitle>
            <DialogDescription>
              Move the customer to permanent Free without granting another
              trial. Live paid subscriptions are canceled immediately first.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='bg-muted rounded-lg p-3 text-sm'>
              <p>
                {ASSIGN_FREE_AFTER_CANCELLATION_PREVIEW.confirmationMessage}
              </p>
            </div>

            <div>
              <Label htmlFor='assign-free-billing-reason'>Reason</Label>
              <Input
                id='assign-free-billing-reason'
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
                I confirm this customer should receive permanent Free without a
                trial period.
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
              {isPending ? 'Assigning...' : 'Assign Free'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
