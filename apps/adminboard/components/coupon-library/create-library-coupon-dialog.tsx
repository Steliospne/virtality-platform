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
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorMessage } from '@/lib/get-error-message'
import { useCreateLibraryCoupon } from '@virtality/react-query'
import {
  COUPON_LIBRARY_CURRENCY,
  COUPON_LIBRARY_PLANS,
  majorToMinorUnits,
  type CouponDuration,
  type CouponLibraryPlanId,
  type CreateLibraryCouponInput,
} from '@virtality/shared/utils'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

type CreateLibraryCouponDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DiscountKind = 'percent' | 'amount'

const DEFAULT_PLAN_IDS: CouponLibraryPlanId[] = ['pro']

export function CreateLibraryCouponDialog({
  open,
  onOpenChange,
}: CreateLibraryCouponDialogProps) {
  const [name, setName] = useState('')
  const [discountKind, setDiscountKind] = useState<DiscountKind>('percent')
  const [percentOff, setPercentOff] = useState('')
  const [amountMajor, setAmountMajor] = useState('')
  const [duration, setDuration] = useState<CouponDuration>('once')
  const [durationInMonths, setDurationInMonths] = useState('')
  const [planIds, setPlanIds] =
    useState<CouponLibraryPlanId[]>(DEFAULT_PLAN_IDS)
  const { mutate: createLibraryCoupon, isPending } = useCreateLibraryCoupon()

  useEffect(() => {
    if (open) return
    setName('')
    setDiscountKind('percent')
    setPercentOff('')
    setAmountMajor('')
    setDuration('once')
    setDurationInMonths('')
    setPlanIds(DEFAULT_PLAN_IDS)
  }, [open])

  const togglePlan = (planId: CouponLibraryPlanId) => {
    setPlanIds((current) =>
      current.includes(planId)
        ? current.filter((id) => id !== planId)
        : [...current, planId],
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (planIds.length === 0) {
      toast.error('Select at least one plan')
      return
    }

    const payload: CreateLibraryCouponInput = {
      name: name.trim(),
      duration,
      planIds,
    }

    if (discountKind === 'percent') {
      const parsed = Number(percentOff)
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
        toast.error('Percent off must be greater than 0 and at most 100')
        return
      }
      payload.percentOff = parsed
    } else {
      const parsed = Number(amountMajor)
      try {
        payload.amountOff = majorToMinorUnits(parsed)
      } catch {
        toast.error(
          `Amount off must be a positive ${COUPON_LIBRARY_CURRENCY.toUpperCase()} amount`,
        )
        return
      }
    }

    if (duration === 'repeating') {
      const months = Number(durationInMonths)
      if (!Number.isInteger(months) || months < 1) {
        toast.error('Repeating duration needs a whole number of months')
        return
      }
      payload.durationInMonths = months
    }

    createLibraryCoupon(payload, {
      onSuccess: (created) => {
        toast.success(`Created ${created.name ?? created.id}`)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, 'Failed to create Coupon'))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>
              Stripe is source of truth. Duration and discount are fixed at
              create. Amount-off uses catalog currency (
              {COUPON_LIBRARY_CURRENCY.toUpperCase()}).
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='coupon-name'>Name</Label>
              <Input
                id='coupon-name'
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label>Discount type</Label>
              <Select
                value={discountKind}
                onValueChange={(value) =>
                  setDiscountKind(value as DiscountKind)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='percent'>Percent off</SelectItem>
                  <SelectItem value='amount'>Amount off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {discountKind === 'percent' ? (
              <div className='grid gap-2'>
                <Label htmlFor='coupon-percent'>Percent off</Label>
                <Input
                  id='coupon-percent'
                  type='number'
                  min={0.01}
                  max={100}
                  step='any'
                  value={percentOff}
                  onChange={(event) => setPercentOff(event.target.value)}
                  required
                />
              </div>
            ) : (
              <div className='grid gap-2'>
                <Label htmlFor='coupon-amount'>
                  Amount off ({COUPON_LIBRARY_CURRENCY.toUpperCase()})
                </Label>
                <Input
                  id='coupon-amount'
                  type='number'
                  min={0.01}
                  step='0.01'
                  value={amountMajor}
                  onChange={(event) => setAmountMajor(event.target.value)}
                  required
                />
              </div>
            )}
            <div className='grid gap-2'>
              <Label>Duration</Label>
              <Select
                value={duration}
                onValueChange={(value) => setDuration(value as CouponDuration)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='once'>Once</SelectItem>
                  <SelectItem value='repeating'>Repeating</SelectItem>
                  <SelectItem value='forever'>Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {duration === 'repeating' ? (
              <div className='grid gap-2'>
                <Label htmlFor='coupon-months'>Duration in months</Label>
                <Input
                  id='coupon-months'
                  type='number'
                  min={1}
                  step={1}
                  value={durationInMonths}
                  onChange={(event) => setDurationInMonths(event.target.value)}
                  required
                />
              </div>
            ) : null}
            <div className='grid gap-2'>
              <Label>Applies to</Label>
              <div className='flex flex-col gap-2'>
                {COUPON_LIBRARY_PLANS.map((plan) => (
                  <label
                    key={plan.planId}
                    className='flex items-center gap-2 text-sm'
                  >
                    <Checkbox
                      checked={planIds.includes(plan.planId)}
                      onCheckedChange={() => togglePlan(plan.planId)}
                    />
                    {plan.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' variant='primary' disabled={isPending}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
