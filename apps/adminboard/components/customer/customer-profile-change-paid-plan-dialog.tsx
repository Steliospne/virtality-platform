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
import {
  useChangePaidPlan,
  usePreviewChangePaidPlan,
} from '@virtality/react-query'
import {
  SUPPORTED_PRO_PLAN_PRICE_IDS,
  formatProPlanPriceLabel,
  PRO_PLAN_MONTHLY_PRICE_ID,
} from '@virtality/shared/utils'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  formatBillingMutationSuccessMessage,
  formatMutationErrorMessage,
} from '@/lib/admin-customer-actions'

type SupportedProPlanPriceId = (typeof SUPPORTED_PRO_PLAN_PRICE_IDS)[number]

type CustomerProfileChangePaidPlanDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileChangePaidPlanDialog({
  userId,
  open,
  onOpenChange,
}: CustomerProfileChangePaidPlanDialogProps) {
  const { mutate, isPending } = useChangePaidPlan()
  const [reason, setReason] = useState('')
  const [targetPriceId, setTargetPriceId] = useState<SupportedProPlanPriceId>(
    PRO_PLAN_MONTHLY_PRICE_ID,
  )
  const [confirmed, setConfirmed] = useState(false)
  const preview = usePreviewChangePaidPlan({
    userId,
    targetPriceId,
    enabled: open && targetPriceId.length > 0,
  })

  const canSubmit =
    reason.trim().length >= 3 && confirmed && !isPending && !preview.isLoading

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      {
        userId,
        reason: reason.trim(),
        targetPriceId,
      },
      {
        onSuccess: (result) => {
          toast.success(formatBillingMutationSuccessMessage(result))
          if (result.checkoutUrl) {
            void navigator.clipboard.writeText(result.checkoutUrl)
            toast.message('Checkout link copied to clipboard.')
          }
          setReason('')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(error, 'Failed to change paid plan'),
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
            <DialogTitle>Change paid plan</DialogTitle>
            <DialogDescription>
              Select a supported Pro interval. Customers without a payment
              method receive a Checkout link and stay on Free until purchase
              completes.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label>Paid Pro interval</Label>
              <Select
                value={targetPriceId}
                onValueChange={(value) =>
                  setTargetPriceId(value as SupportedProPlanPriceId)
                }
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_PRO_PLAN_PRICE_IDS.map((priceId) => (
                    <SelectItem key={priceId} value={priceId}>
                      {formatProPlanPriceLabel(priceId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {preview.data ? (
              <div className='bg-muted rounded-lg p-3 text-sm'>
                <p>{preview.data.confirmationMessage}</p>
                {preview.data.prorationSummary ? (
                  <p className='text-muted-foreground mt-2'>
                    {preview.data.prorationSummary}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <Label htmlFor='change-paid-plan-reason'>Reason</Label>
              <Input
                id='change-paid-plan-reason'
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
                I confirm the effective timing and any proration described
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
            <Button type='submit' disabled={!canSubmit}>
              {isPending ? 'Saving...' : 'Confirm change'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
