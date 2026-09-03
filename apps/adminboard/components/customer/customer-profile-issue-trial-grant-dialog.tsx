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
import { useIssueTrialGrant } from '@virtality/react-query'
import {
  isEntitlementExtensionDurationUnit,
  type EntitlementExtensionDurationUnit,
} from '@virtality/shared/utils'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatMutationErrorMessage } from '@/lib/admin-customer-actions'
import {
  EXTENSION_DURATION_UNIT_LABELS,
  EXTENSION_DURATION_UNITS,
} from '@/lib/entitlement-extension'
import { formatIssueTrialGrantSuccessMessage } from '@/lib/trial-grant-actions'

type CustomerProfileIssueTrialGrantDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileIssueTrialGrantDialog({
  userId,
  open,
  onOpenChange,
}: CustomerProfileIssueTrialGrantDialogProps) {
  const { mutate, isPending } = useIssueTrialGrant()
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('14')
  const [unit, setUnit] = useState<EntitlementExtensionDurationUnit>('days')
  const [confirmed, setConfirmed] = useState(false)

  const parsedAmount = Number(amount)
  const validAmount = Number.isInteger(parsedAmount) && parsedAmount > 0
  const canSubmit =
    reason.trim().length >= 3 && validAmount && confirmed && !isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    mutate(
      {
        userId,
        reason: reason.trim(),
        amount: parsedAmount,
        unit,
      },
      {
        onSuccess: (result) => {
          toast.success(formatIssueTrialGrantSuccessMessage(result))
          setReason('')
          setAmount('14')
          setUnit('days')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(error, 'Failed to issue trial grant'),
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
            <DialogTitle>Issue trial grant</DialogTitle>
            <DialogDescription>
              Creates an active TrialGrant for this customer. The trial clock
              starts immediately for the selected duration, without creating a
              Stripe subscription.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='issue-trial-grant-amount'>Duration</Label>
                <Input
                  id='issue-trial-grant-amount'
                  className='mt-1'
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode='numeric'
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select
                  value={unit}
                  onValueChange={(value) => {
                    if (isEntitlementExtensionDurationUnit(value)) {
                      setUnit(value)
                    }
                  }}
                >
                  <SelectTrigger className='mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTENSION_DURATION_UNITS.map((durationUnit) => (
                      <SelectItem key={durationUnit} value={durationUnit}>
                        {EXTENSION_DURATION_UNIT_LABELS[durationUnit]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor='issue-trial-grant-reason'>Reason</Label>
              <Input
                id='issue-trial-grant-reason'
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
                I confirm this customer should receive an active trial grant
                for the selected duration now.
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
              {isPending ? 'Issuing...' : 'Issue grant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
