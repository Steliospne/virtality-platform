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
  useCampaignPickerCoupons,
  useCampaignWindow,
  useCloseCampaignWindow,
  useUpsertCampaignWindow,
} from '@virtality/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  CAMPAIGN_COUPON_HEALTH_LABELS,
  CAMPAIGN_WINDOW_LIFECYCLE_LABELS,
  CAMPAIGN_WINDOW_PAGE_DESCRIPTION,
  formatCampaignAttachingStatus,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '@/lib/campaign-window'
import { formatCouponDiscount } from '@/lib/coupon-library-display'

export function CampaignWindowPage() {
  const { data, isPending } = useCampaignWindow()
  const { data: pickerCoupons, isPending: pickerPending } =
    useCampaignPickerCoupons()
  const { mutate: upsertWindow, isPending: saving } = useUpsertCampaignWindow()
  const { mutate: closeWindow, isPending: closing } = useCloseCampaignWindow()

  const [couponId, setCouponId] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  useEffect(() => {
    if (!data?.window) return
    setCouponId(data.window.couponId)
    setStartsAt(toDatetimeLocalValue(data.window.startsAt))
    setEndsAt(toDatetimeLocalValue(data.window.endsAt))
  }, [data?.window])

  const busy = saving || closing
  const canClose = data?.lifecycle === 'scheduled' || data?.lifecycle === 'live'

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!couponId) {
      toast.error('Select a Coupon from the library')
      return
    }
    if (!startsAt || !endsAt) {
      toast.error('Start and end dates are required')
      return
    }

    const startsAtDate = fromDatetimeLocalValue(startsAt)
    const endsAtDate = fromDatetimeLocalValue(endsAt)
    if (endsAtDate.getTime() <= startsAtDate.getTime()) {
      toast.error('End must be after start')
      return
    }

    upsertWindow(
      {
        couponId,
        startsAt: startsAtDate,
        endsAt: endsAtDate,
      },
      {
        onSuccess: () => {
          toast.success('Campaign Window saved')
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to save Campaign Window',
          )
        },
      },
    )
  }

  const handleClose = () => {
    closeWindow(undefined, {
      onSuccess: () => {
        toast.success('Campaign Window closed; new Checkout attaches stopped')
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to close Campaign Window',
        )
      },
    })
  }

  return (
    <div className='min-h-screen-with-header mx-auto max-w-3xl px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold tracking-tight'>Campaign Window</h1>
        <p className='text-muted-foreground mt-2 max-w-2xl'>
          {CAMPAIGN_WINDOW_PAGE_DESCRIPTION}
        </p>
      </div>

      <div className='bg-muted/40 mb-8 grid gap-2 rounded-lg p-4 text-sm'>
        <p>
          Status:{' '}
          <span className='font-medium'>
            {isPending
              ? 'Loading…'
              : CAMPAIGN_WINDOW_LIFECYCLE_LABELS[data?.lifecycle ?? 'none']}
          </span>
        </p>
        <p>
          Coupon health:{' '}
          <span className='font-medium'>
            {data?.window
              ? CAMPAIGN_COUPON_HEALTH_LABELS[data.couponHealth]
              : '—'}
          </span>
        </p>
        <p>
          Checkout:{' '}
          <span className='font-medium'>
            {data ? formatCampaignAttachingStatus(data.attaching) : 'Loading…'}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className='grid gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='campaign-coupon'>Coupon</Label>
          <Select
            value={couponId || undefined}
            onValueChange={setCouponId}
            disabled={pickerPending || busy}
          >
            <SelectTrigger id='campaign-coupon' className='w-full'>
              <SelectValue
                placeholder={
                  pickerPending
                    ? 'Loading Coupons…'
                    : (pickerCoupons?.length ?? 0) === 0
                      ? 'No eligible Coupons'
                      : 'Select a Coupon'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {(pickerCoupons ?? []).map((coupon) => (
                <SelectItem key={coupon.id} value={coupon.id}>
                  {coupon.name ?? coupon.id} ({formatCouponDiscount(coupon)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='grid gap-2 sm:grid-cols-2 sm:gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='campaign-starts-at'>Starts</Label>
            <Input
              id='campaign-starts-at'
              type='datetime-local'
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              disabled={busy}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='campaign-ends-at'>Ends</Label>
            <Input
              id='campaign-ends-at'
              type='datetime-local'
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              disabled={busy}
              required
            />
          </div>
        </div>

        <div className='flex flex-wrap gap-3'>
          <Button type='submit' variant='primary' disabled={busy}>
            {saving ? 'Saving…' : 'Save Campaign Window'}
          </Button>
          <Button
            type='button'
            variant='outline'
            disabled={busy || !canClose}
            onClick={handleClose}
          >
            {closing ? 'Closing…' : 'Close window'}
          </Button>
        </div>
      </form>
    </div>
  )
}
