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
import { useAdjustTrialGrant } from '@virtality/react-query'
import {
  isEntitlementExtensionDirection,
  isEntitlementExtensionDurationUnit,
  type EntitlementExtensionDirection,
  type EntitlementExtensionDurationUnit,
} from '@virtality/shared/utils'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { formatMutationErrorMessage } from '@/lib/admin-customer-actions'
import {
  EXTENSION_DIRECTION_LABELS,
  EXTENSION_DIRECTIONS,
  EXTENSION_DURATION_UNIT_LABELS,
  EXTENSION_DURATION_UNITS,
} from '@/lib/entitlement-extension'
import { formatAdjustTrialGrantSuccessMessage } from '@/lib/trial-grant-actions'

type CustomerProfileAdjustTrialGrantDialogProps = {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerProfileAdjustTrialGrantDialog({
  userId,
  open,
  onOpenChange,
}: CustomerProfileAdjustTrialGrantDialogProps) {
  const { mutate, isPending } = useAdjustTrialGrant()
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('7')
  const [unit, setUnit] = useState<EntitlementExtensionDurationUnit>('days')
  const [direction, setDirection] =
    useState<EntitlementExtensionDirection>('extend')
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
        direction,
      },
      {
        onSuccess: (result) => {
          toast.success(formatAdjustTrialGrantSuccessMessage(result))
          setReason('')
          setAmount('7')
          setUnit('days')
          setDirection('extend')
          setConfirmed(false)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(
            formatMutationErrorMessage(error, 'Failed to adjust trial grant'),
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
            <DialogTitle>Adjust trial grant</DialogTitle>
            <DialogDescription>
              Extends or reduces the active grant clock end directly in the
              database. No Stripe call is made for this owned-trial path.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <Label>Direction</Label>
              <Select
                value={direction}
                onValueChange={(value) => {
                  if (isEntitlementExtensionDirection(value)) {
                    setDirection(value)
                  }
                }}
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXTENSION_DIRECTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {EXTENSION_DIRECTION_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='adjust-trial-grant-amount'>Duration</Label>
                <Input
                  id='adjust-trial-grant-amount'
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
              <Label htmlFor='adjust-trial-grant-reason'>Reason</Label>
              <Input
                id='adjust-trial-grant-reason'
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
                I confirm this adjustment should change the owned trial clock
                end for this customer.
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
              {isPending ? 'Saving...' : 'Adjust grant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
