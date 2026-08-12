'use client'

/**
 * PROTOTYPE Variant A: Stacked plan cards.
 * Marketing-style hierarchy: status, then two large Monthly/Yearly cards, then CTA.
 * Yearly shows monthly-equivalent primary, yearly total muted.
 */

import { Check } from 'lucide-react'
import { Badge } from '@virtality/ui/components/badge'
import { Button } from '@virtality/ui/components/button'
import {
  prototypeCheckoutCtaLabel,
  prototypeStatusHeadline,
  type PrototypeBillingVariantProps,
} from './prototype-billing-model'
import { cn } from '@/lib/utils'

export const VARIANT_A_META = {
  key: 'A',
  name: 'Stacked plan cards',
} as const

export function VariantAStackedPlanCards({
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
    <div className='space-y-6'>
      <header className='space-y-2'>
        <p className='text-xs font-medium tracking-wide text-zinc-500 uppercase'>
          Billing
        </p>
        <h2 className='text-2xl font-semibold tracking-tight'>
          {prototypeStatusHeadline(standing)}
        </h2>
        {standing.clockEndLabel ? (
          <p className='text-sm text-zinc-500'>{standing.clockEndLabel}</p>
        ): (
          <p className='text-sm text-zinc-500'>
            Choose Monthly or Yearly Pro to start Checkout. Stub uses real
            upgrade params.
          </p>
        )}
      </header>

      <div className='grid gap-3'>
        <button
          type='button'
          disabled={entitled}
          onClick={() => onSelectInterval('month')}
          className={cn(
            'rounded-xl border-2 p-5 text-left transition',
            selectedInterval === 'month'
              ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
             : 'border-zinc-200 dark:border-zinc-800',
            entitled && 'opacity-60',
          )}
        >
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-lg font-semibold'>Monthly</p>
              <p className='mt-1 text-sm text-zinc-500'>
                Flexible. Cancel anytime before renewal.
              </p>
            </div>
            <p className='text-lg font-semibold tabular-nums'>
              {prices.monthlyLabel}
            </p>
          </div>
          {selectedInterval === 'month' ? (
            <p className='mt-3 flex items-center gap-1.5 text-sm font-medium'>
              <Check className='size-4' /> Selected
            </p>
          ): null}
        </button>

        <button
          type='button'
          disabled={entitled}
          onClick={() => onSelectInterval('year')}
          className={cn(
            'rounded-xl border-2 p-5 text-left transition',
            selectedInterval === 'year'
              ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
             : 'border-zinc-200 dark:border-zinc-800',
            entitled && 'opacity-60',
          )}
        >
          <div className='flex items-start justify-between gap-3'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='text-lg font-semibold'>Yearly</p>
                <Badge>{prices.yearlySavingsLabel}</Badge>
              </div>
              <p className='mt-1 text-sm text-zinc-500'>
                One payment. Same Pro access for twelve months.
              </p>
            </div>
            <div className='text-right'>
              <p className='text-lg font-semibold tabular-nums'>
                {prices.yearlyAsMonthlyLabel}
              </p>
              <p className='mt-0.5 text-sm text-zinc-400 tabular-nums'>
                {prices.yearlyTotalMutedLabel}
              </p>
            </div>
          </div>
          {selectedInterval === 'year' ? (
            <p className='mt-3 flex items-center gap-1.5 text-sm font-medium'>
              <Check className='size-4' /> Selected
            </p>
          ): null}
        </button>
      </div>

      <Button
        type='button'
        variant='primary'
        className='w-full'
        size='lg'
        onClick={onCheckout}
      >
        {cta}
      </Button>

      {lastAction ? (
        <p className='text-center text-xs text-zinc-500'>{lastAction}</p>
      ): null}
    </div>
  )
}
