'use client'

/**
 * PROTOTYPE Variant C: Compact receipt row.
 * Almost no marketing chrome: one plan row, interval toggle, footer action.
 * Yearly shows monthly-equivalent primary, yearly total muted.
 */

import { Button } from '@virtality/ui/components/button'
import {
  prototypeCheckoutCtaLabel,
  prototypeStatusHeadline,
  type PrototypeBillingVariantProps,
} from './prototype-billing-model'
import { cn } from '@/lib/utils'

export const VARIANT_C_META = {
  key: 'C',
  name: 'Compact receipt row',
} as const

export function VariantCCompactReceiptRow({
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
      <div className='flex items-baseline justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800'>
        <div>
          <h2 className='text-base font-medium'>
            {prototypeStatusHeadline(standing)}
          </h2>
          <p className='mt-0.5 text-xs text-zinc-500'>
            {standing.clockEndLabel ??
              'No Entitlement Clock until Checkout completes'}
          </p>
        </div>
        <p className='text-xs tracking-wide text-zinc-400 uppercase'>Billing</p>
      </div>

      <div className='space-y-1'>
        <div className='grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 text-sm'>
          <div>
            <p className='font-medium'>Pro</p>
            <p className='text-xs text-zinc-500'>Canonical clinician plan</p>
          </div>

          <div
            className={cn(
              'inline-flex rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700',
              entitled && 'pointer-events-none opacity-50',
            )}
            role='group'
            aria-label='Billing interval'
          >
            <button
              type='button'
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium',
                selectedInterval === 'month'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                 : 'text-zinc-600 dark:text-zinc-300',
              )}
              onClick={() => onSelectInterval('month')}
            >
              Monthly
            </button>
            <button
              type='button'
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium',
                selectedInterval === 'year'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                 : 'text-zinc-600 dark:text-zinc-300',
              )}
              onClick={() => onSelectInterval('year')}
            >
              Yearly
            </button>
          </div>

          <div className='min-w-28 text-right'>
            {selectedInterval === 'year' ? (
              <>
                <p className='font-medium tabular-nums'>
                  {prices.yearlyAsMonthlyLabel}
                </p>
                <p className='text-xs text-zinc-400 tabular-nums'>
                  {prices.yearlyTotalMutedLabel}
                </p>
              </>
            ): (
              <p className='font-medium tabular-nums'>{prices.monthlyLabel}</p>
            )}
          </div>
        </div>

        {selectedInterval === 'year' ? (
          <p className='text-right text-xs text-zinc-500'>
            {prices.yearlySavingsLabel}
          </p>
        ): null}
      </div>

      <div className='flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800'>
        <p className='text-xs text-zinc-500'>
          Stub Checkout ·{' '}
          {selectedInterval === 'year' ? 'annual=true': 'annual=false'}
        </p>
        <Button type='button' variant='primary' size='sm' onClick={onCheckout}>
          {cta}
        </Button>
      </div>

      {lastAction ? (
        <p className='font-mono text-[11px] text-zinc-500'>{lastAction}</p>
      ): null}
    </div>
  )
}
