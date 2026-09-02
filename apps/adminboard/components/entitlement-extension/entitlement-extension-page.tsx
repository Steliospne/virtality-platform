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
  isEntitlementExtensionDirection,
  isEntitlementExtensionDurationUnit,
  type EntitlementExtensionDirection,
  type EntitlementExtensionDurationUnit,
} from '@virtality/shared/utils'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  EXTENSION_DIRECTION_LABELS,
  EXTENSION_DIRECTIONS,
  EXTENSION_DURATION_UNIT_LABELS,
  EXTENSION_DURATION_UNITS,
  EXTENSION_PAGE_DESCRIPTION,
  EXTENSION_SEAT_STATUS_LABELS,
  extensionSeatSelectPlaceholder,
  formatExtensionSeatHint,
  formatExtensionSuccessMessage,
} from '@/lib/entitlement-extension'

export function EntitlementExtensionPage() {
  const { data: seats, isPending: seatsPending } = useExtendableSeats()
  const { mutate: extendClock, isPending } = useExtendEntitlementClock()

  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('7')
  const [unit, setUnit] = useState<EntitlementExtensionDurationUnit>('days')
  const [direction, setDirection] =
    useState<EntitlementExtensionDirection>('extend')

  const selectedSeat = seats?.find((seat) => seat.userId === userId) ?? null
  const canReduce = selectedSeat?.extensionMode === 'update'

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!userId) {
      toast.error('Select a seat to extend')
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
        direction,
      },
      {
        onSuccess: (result) => {
          toast.success(
            formatExtensionSuccessMessage({
              mode: result.mode,
              previousStatus: result.previousStatus,
              trialEnd: result.trialEnd,
              direction,
            }),
          )
          setUserId('')
          setDirection('extend')
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
            onValueChange={(value) => {
              setUserId(value)
              const seat = seats?.find((candidate) => candidate.userId === value)
              if (seat?.extensionMode !== 'update') {
                setDirection('extend')
              }
            }}
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
                  {seat.email} (
                  {EXTENSION_SEAT_STATUS_LABELS[seat.subscriptionStatus]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSeat ? (
            <p className='text-muted-foreground text-sm'>
              {selectedSeat.name}: {formatExtensionSeatHint(selectedSeat)}
            </p>
          ) : null}
        </div>

        <div className='grid gap-4 sm:grid-cols-3'>
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
          <div className='grid gap-2'>
            <Label htmlFor='extension-direction'>Direction</Label>
            <Select
              value={direction}
              onValueChange={(value) => {
                if (isEntitlementExtensionDirection(value)) {
                  setDirection(value)
                }
              }}
              disabled={isPending || !canReduce}
            >
              <SelectTrigger id='extension-direction' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXTENSION_DIRECTIONS.map((candidateDirection) => (
                  <SelectItem
                    key={candidateDirection}
                    value={candidateDirection}
                    disabled={candidateDirection === 'reduce' && !canReduce}
                  >
                    {EXTENSION_DIRECTION_LABELS[candidateDirection]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSeat && !canReduce ? (
              <p className='text-muted-foreground text-sm'>
                Only a live seat can be reduced.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <Button
            type='submit'
            variant='primary'
            disabled={isPending || seatsPending || !userId}
          >
            {isPending
              ? direction === 'reduce'
                ? 'Reducing...'
                : 'Extending...'
              : direction === 'reduce'
                ? 'Reduce Entitlement Clock'
                : 'Extend Entitlement Clock'}
          </Button>
        </div>
      </form>
    </div>
  )
}
