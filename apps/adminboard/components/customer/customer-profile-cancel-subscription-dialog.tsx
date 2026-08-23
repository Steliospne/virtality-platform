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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { useCancelPaidSubscription } from '@virtality/react-query'
import { buildCancelPaidSubscriptionPreview } from '@virtality/shared/utils'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  formatBillingMutationSuccessMessage,
  formatMutationErrorMessage,
  getCancelPaidSubscriptionPreviewPeriodEnd,
} from '@/lib/admin-customer-actions'
import type { AdminCustomerProfile } from '@virtality/shared/utils'

type CustomerProfileCancelSubscriptionDialogProps = {
  profile: AdminCustomerProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileCancelSubscriptionDialog({
  profile,
  open,
  onOpenChange,
}: CustomerProfileCancelSubscriptionDialogProps) {
  const { mutate, isPending } = useCancelPaidSubscription()
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState<'immediate' | 'period_end'>('period_end')
  const [confirmed, setConfirmed] = useState(false)

  const primaryPeriodEnd = getCancelPaidSubscriptionPreviewPeriodEnd(profile)

  const preview = useMemo(
    () =>
      buildCancelPaidSubscriptionPreview({
        mode,
        periodEnd: primaryPeriodEnd,
      }),
    [mode, primaryPeriodEnd],
  )

  const canSubmit = reason.trim().length >= 3 && confirmed && !isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      {
        userId: profile.userId,
        reason: reason.trim(),
        mode,
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
            formatMutationErrorMessage(error, 'Failed to cancel subscription'),
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
            <DialogTitle>Cancel paid subscription</DialogTitle>
            <DialogDescription>
              Choose immediate cancellation or schedule cancellation at the
              current period end.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label>Cancellation timing</Label>
              <Select
                value={mode}
                onValueChange={(value) => {
                  if (value === 'immediate' || value === 'period_end') {
                    setMode(value)
                  }
                }}
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='period_end'>At period end</SelectItem>
                  <SelectItem value='immediate'>Immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='bg-muted rounded-lg p-3 text-sm'>
              <p>{preview.confirmationMessage}</p>
              {preview.prorationSummary ? (
                <p className='text-muted-foreground mt-2'>
                  {preview.prorationSummary}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor='cancel-subscription-reason'>Reason</Label>
              <Input
                id='cancel-subscription-reason'
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
                I confirm the cancellation timing and consequences described
                above.
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
            <Button type='submit' disabled={!canSubmit} variant='destructive'>
              {isPending ? 'Canceling...' : 'Confirm cancellation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
