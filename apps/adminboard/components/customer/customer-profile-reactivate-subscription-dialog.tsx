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
import { useReactivatePaidSubscription } from '@virtality/react-query'
import { buildReactivatePaidSubscriptionPreview } from '@virtality/shared/utils'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  formatBillingMutationSuccessMessage,
  formatMutationErrorMessage,
  getReactivatePaidSubscriptionPreviewPeriodEnd,
} from '@/lib/admin-customer-actions'
import type { AdminCustomerProfile } from '@virtality/shared/utils'

type CustomerProfileReactivateSubscriptionDialogProps = {
  profile: AdminCustomerProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileReactivateSubscriptionDialog({
  profile,
  open,
  onOpenChange,
}: CustomerProfileReactivateSubscriptionDialogProps) {
  const { mutate, isPending } = useReactivatePaidSubscription()
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const primaryPeriodEnd =
    getReactivatePaidSubscriptionPreviewPeriodEnd(profile)

  const preview = useMemo(
    () => buildReactivatePaidSubscriptionPreview(primaryPeriodEnd),
    [primaryPeriodEnd],
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
              'Failed to reactivate subscription',
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
            <DialogTitle>Reactivate subscription</DialogTitle>
            <DialogDescription>
              Remove a scheduled cancellation so the paid subscription renews at
              period end.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='bg-muted rounded-lg p-3 text-sm'>
              <p>{preview.confirmationMessage}</p>
            </div>

            <div>
              <Label htmlFor='reactivate-subscription-reason'>Reason</Label>
              <Input
                id='reactivate-subscription-reason'
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
              <span>I confirm this subscription should continue renewing.</span>
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
              {isPending ? 'Reactivating...' : 'Reactivate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
