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
import { useCancelCyclePlanChange } from '@virtality/react-query'
import { buildCancelCyclePlanChangePreview } from '@virtality/shared/utils'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  formatBillingMutationSuccessMessage,
  formatMutationErrorMessage,
  getCancelCyclePlanChangePreviewPeriodEnd,
} from '@/lib/admin-customer-actions'
import type { AdminCustomerProfile } from '@virtality/shared/utils'

type CustomerProfileCancelCyclePlanChangeDialogProps = {
  profile: AdminCustomerProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileCancelCyclePlanChangeDialog({
  profile,
  open,
  onOpenChange,
}: CustomerProfileCancelCyclePlanChangeDialogProps) {
  const { mutate, isPending } = useCancelCyclePlanChange()
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const periodEnd = getCancelCyclePlanChangePreviewPeriodEnd(profile)
  const preview = useMemo(
    () => buildCancelCyclePlanChangePreview(periodEnd),
    [periodEnd],
  )

  const canSubmit = reason.trim().length >= 3 && confirmed && !isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      {
        userId: profile.userId,
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
              'Failed to cancel Cycle plan change',
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
            <DialogTitle>Cancel Cycle plan change</DialogTitle>
            <DialogDescription>
              Release the queued Default interval switch. The customer stays on
              the current plan for the rest of this billing cycle.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='bg-muted rounded-lg p-3 text-sm'>
              <p>{preview.confirmationMessage}</p>
            </div>

            <div>
              <Label htmlFor='cancel-cycle-plan-change-reason'>Reason</Label>
              <Input
                id='cancel-cycle-plan-change-reason'
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
                I confirm this queued Cycle plan change should be canceled.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Keep schedule
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isPending ? 'Canceling...' : 'Cancel Cycle plan change'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
