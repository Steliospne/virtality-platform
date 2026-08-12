'use client'

/**
 * PROTOTYPE Variant B: Split status + interval.
 * Settings density: standing on the left, interval radios + CTA on the right.
 * Yearly shows monthly-equivalent primary, yearly total muted. No role in UI.
 */

import { Button } from '@virtality/ui/components/button'
import { Label } from '@virtality/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  prototypeCheckoutCtaLabel,
  prototypeStatusHeadline,
  type PrototypeBillingInterval,
  type PrototypeBillingVariantProps,
} from './prototype-billing-model'

export const VARIANT_B_META = {
  key: 'B',
  name: 'Split status + interval',
} as const

export function VariantBSplitStatusInterval({
  standing,
  prices,
  selectedInterval,
  onSelectInterval,
  onCheckout,
  lastAction,
}: PrototypeBillingVariantProps) {
  const cta = prototypeCheckoutCtaLabel(standing)
  const entitled = standing.subscriptionStatus === 'active'

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2'>
        <section className='space-y-3 border-r-0 border-zinc-200 md:border-r md:pr-4 dark:border-zinc-800'>
          <p className='text-xs font-medium tracking-wide text-zinc-500 uppercase'>
            Current standing
          </p>
          <h2 className='text-xl font-semibold'>
            {prototypeStatusHeadline(standing)}
          </h2>
          <dl className='space-y-2 text-sm'>
            <div className='flex justify-between gap-4'>
              <dt className='text-zinc-500'>Billing path</dt>
              <dd className='font-medium'>
                {standing.billingPathEstablished ? 'Established': 'Not yet'}
              </dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-zinc-500'>Clock</dt>
              <dd className='font-medium'>
                {standing.clockEndLabel ?? 'No clock'}
              </dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-zinc-500'>Paid history</dt>
              <dd className='font-medium'>
                {standing.hadPaidBilling ? 'Yes': 'No'}
              </dd>
            </div>
          </dl>
        </section>

        <section className='space-y-4 md:pl-2'>
          <div>
            <p className='text-xs font-medium tracking-wide text-zinc-500 uppercase'>
              Pro plan
            </p>
            <p className='mt-1 text-sm text-zinc-500'>
              Same product. Interval only changes the Stripe Price.
            </p>
          </div>

          <RadioGroup
            value={selectedInterval}
            disabled={entitled}
            onValueChange={(value) =>
              onSelectInterval(value as PrototypeBillingInterval)
            }
            className='gap-3'
          >
            <div className='flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2.5 dark:border-zinc-800'>
              <div className='flex items-center gap-2'>
                <RadioGroupItem value='month' id='proto-b-month' />
                <Label htmlFor='proto-b-month'>Monthly</Label>
              </div>
              <span className='text-sm tabular-nums'>
                {prices.monthlyLabel}
              </span>
            </div>
            <div className='flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2.5 dark:border-zinc-800'>
              <div className='flex items-center gap-2'>
                <RadioGroupItem value='year' id='proto-b-year' />
                <Label htmlFor='proto-b-year'>Yearly</Label>
              </div>
              <div className='text-right'>
                <span className='text-sm font-medium tabular-nums'>
                  {prices.yearlyAsMonthlyLabel}
                </span>
                <p className='text-xs text-zinc-400 tabular-nums'>
                  {prices.yearlyTotalMutedLabel}
                </p>
                <p className='text-xs text-zinc-500'>
                  {prices.yearlySavingsLabel}
                </p>
              </div>
            </div>
          </RadioGroup>

          <Button
            type='button'
            variant='primary'
            className='w-full'
            onClick={onCheckout}
          >
            {cta}
          </Button>
          {lastAction ? (
            <p className='text-xs text-zinc-500'>{lastAction}</p>
          ): null}
        </section>
      </div>
    </div>
  )
}
