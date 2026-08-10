'use client'

import { Button } from '@/components/ui/button'
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
  useExtendEntitlementClock,
  useExtendableSeats,
} from '@virtality/react-query'
import {
  isEntitlementExtensionDurationUnit,
  type EntitlementExtensionDurationUnit,
} from '@virtality/shared/utils'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  EXTENSION_DURATION_UNIT_LABELS,
  EXTENSION_DURATION_UNITS,
  EXTENSION_PAGE_DESCRIPTION,
  extensionSeatSelectPlaceholder,
  formatExtensionClockEnd,
} from '@/lib/entitlement-extension'

export function EntitlementExtensionPage() {
  const { data: seats, isPending: seatsPending } = useExtendableSeats()
  const { mutate: extendClock, isPending } = useExtendEntitlementClock()

  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('7')
  const [unit, setUnit] = useState<EntitlementExtensionDurationUnit>('days')

  const selectedSeat = seats?.find((seat) => seat.userId === userId) ?? null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!userId) {
      toast.error('Select a live seat to extend')
      return
    }

    const parsedAmount = Number(amount)
    if (!Number.isInteger(parsedAmount) || parsedAmount < 1) {
      toast.error('Duration amount must be a positive whole number')
      return
    }

    extendClock(
      {
        userId,
        amount: parsedAmount,
        unit,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Extended ${result.previousStatus} seat through ${formatExtensionClockEnd(result.trialEnd)}. Remaining Time updates after Stripe webhook sync.`,
          )
          setUserId('')
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to extend Entitlement Clock',
          )
        },
      },
    )
  }

  return (
    <div className='min-h-screen-with-header mx-auto max-w-3xl px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Extension</h1>
        <p className='text-muted-foreground mt-2 max-w-2xl'>
          {EXTENSION_PAGE_DESCRIPTION}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='grid gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='extension-seat'>Seat</Label>
          <Select
            value={userId || undefined}
            onValueChange={setUserId}
            disabled={seatsPending || isPending}
          >
            <SelectTrigger id='extension-seat' className='w-full'>
              <SelectValue
                placeholder={extensionSeatSelectPlaceholder(
                  seatsPending,
                  seats?.length ?? 0,
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {(seats ?? []).map((seat) => (
                <SelectItem key={seat.userId} value={seat.userId}>
                  {seat.email} ({seat.subscriptionStatus})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSeat ? (
            <p className='text-muted-foreground text-sm'>
              {selectedSeat.name}: current clock ends{' '}
              {formatExtensionClockEnd(selectedSeat.clockEnd)}
            </p>
          ) : null}
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='extension-amount'>Duration amount</Label>
            <Input
              id='extension-amount'
              type='number'
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={isPending}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='extension-unit'>Duration unit</Label>
            <Select
              value={unit}
              onValueChange={(value) => {
                if (isEntitlementExtensionDurationUnit(value)) {
                  setUnit(value)
                }
              }}
              disabled={isPending}
            >
              <SelectTrigger id='extension-unit' className='w-full'>
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
          <Button
            type='submit'
            variant='primary'
            disabled={isPending || seatsPending || !userId}
          >
            {isPending ? 'Extending...' : 'Extend Entitlement Clock'}
          </Button>
        </div>
      </form>
    </div>
  )
}
