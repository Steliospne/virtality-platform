'use client'

/**
 * Monthly/Yearly Pro plan card with optional Discount price rewrite.
 */

import { Check } from 'lucide-react'
import { Badge } from '@virtality/ui/components/badge'
import { cn } from '@/lib/utils'
import { splitCatalogPriceLabel } from '@/lib/profile-billing'
import { BillingPlanCardCheckoutButton } from './billing-plan-card-checkout-button'

type PlanPriceRewrite = {
  discountedPrimary: string
  listStrike: string
  discountedMuted?: string
  listStrikeMuted?: string
}

function PriceLine({
  primary,
  strike,
  primaryClassName = 'text-xl font-semibold sm:text-2xl',
  catalogClassName = 'text-xl font-semibold sm:text-2xl',
}: {
  primary: string
  strike?: string
  primaryClassName?: string
  catalogClassName?: string
}) {
  if (!strike) {
    return <p className={cn('tabular-nums', primaryClassName)}>{primary}</p>
  }
  const { amount, interval } = splitCatalogPriceLabel(strike)
  return (
    <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
      <p className={cn('tabular-nums', primaryClassName)}>{primary}</p>
      <p className={cn('tabular-nums', catalogClassName)}>
        <span className='text-zinc-400 line-through'>{amount}</span>
        {interval ? ` ${interval}` : null}
      </p>
    </div>
  )
}

function PlanCardPrices({
  listPrimary,
  listMuted,
  rewrite,
}: {
  listPrimary: string
  listMuted?: string
  rewrite: PlanPriceRewrite | null
}) {
  const secondaryLine = (
    <p
      className={cn(
        'min-h-5 text-sm tabular-nums',
        listMuted || rewrite?.discountedMuted ? 'text-zinc-400' : 'invisible',
      )}
      aria-hidden={!listMuted && !rewrite?.discountedMuted}
    >
      {listMuted ?? rewrite?.discountedMuted ?? '\u00a0'}
    </p>
  )

  if (rewrite) {
    return (
      <div className='space-y-1'>
        <PriceLine
          primary={rewrite.discountedPrimary}
          strike={rewrite.listStrike}
        />
        {rewrite.discountedMuted ? (
          <div>
            <PriceLine
              primary={rewrite.discountedMuted}
              strike={rewrite.listStrikeMuted}
              primaryClassName='text-sm font-medium'
              catalogClassName='text-sm font-medium'
            />
          </div>
        ) : (
          secondaryLine
        )}
      </div>
    )
  }

  return (
    <div className='space-y-1'>
      <p className='text-xl font-semibold tabular-nums sm:text-2xl'>
        {listPrimary}
      </p>
      {listMuted ? (
        <p className='min-h-5 text-sm text-zinc-400 tabular-nums'>
          {listMuted}
        </p>
      ) : (
        secondaryLine
      )}
    </div>
  )
}

export function PlanCard({
  title,
  description,
  selected,
  disabled,
  onSelect,
  listPrimary,
  listMuted,
  badge,
  accent = false,
  rewrite,
  checkoutLabel,
  checkoutPending,
  onCheckout,
}: {
  title: string
  description: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
  listPrimary: string
  listMuted?: string
  badge?: string
  accent?: boolean
  rewrite: PlanPriceRewrite | null
  checkoutLabel?: string | null
  checkoutPending?: boolean
  onCheckout?: () => void
}) {
  const hasCheckout = checkoutLabel != null && onCheckout != null
  const className = cn(
    'flex h-full min-h-72 flex-col rounded-xl border-2 p-6 text-left transition sm:min-h-80 sm:p-7',
    accent
      ? selected
        ? 'border-vital-blue-600 bg-vital-blue-50 dark:border-vital-blue-400 dark:bg-vital-blue-950/40'
        : 'border-vital-blue-200 bg-vital-blue-50/60 dark:border-vital-blue-800 dark:bg-vital-blue-950/20'
      : selected
        ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
        : 'border-zinc-200 dark:border-zinc-800',
    disabled && 'opacity-60',
  )
  const body = (
    <>
      <div className='min-h-28 space-y-2 sm:min-h-32'>
        <div className='flex min-h-12 flex-wrap items-start gap-2'>
          <p className='text-xl font-semibold'>{title}</p>
          {badge ? (
            <Badge
              className={
                accent
                  ? 'border-vital-blue-200 bg-vital-blue-100 text-vital-blue-800 dark:border-vital-blue-800 dark:bg-vital-blue-900/60 dark:text-vital-blue-200'
                  : undefined
              }
            >
              {badge}
            </Badge>
          ) : null}
        </div>
        <p className='min-h-11 text-sm leading-relaxed text-zinc-500 sm:min-h-12 sm:text-base'>
          {description}
        </p>
      </div>

      <div className='mt-6 min-h-16'>
        <PlanCardPrices
          listPrimary={listPrimary}
          listMuted={listMuted}
          rewrite={rewrite}
        />
      </div>
      {selected && !hasCheckout ? (
        <p
          className={cn(
            'mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium',
            accent && 'text-vital-blue-800 dark:text-vital-blue-200',
          )}
        >
          <Check
            className={cn(
              'size-4',
              accent && 'text-vital-blue-700 dark:text-vital-blue-300',
            )}
          />
          Selected
        </p>
      ) : null}
      {hasCheckout ? (
        <div className='mt-auto pt-5'>
          <BillingPlanCardCheckoutButton
            label={checkoutLabel}
            pending={checkoutPending ?? false}
            onCheckout={onCheckout}
          />
        </div>
      ) : null}
    </>
  )

  if (hasCheckout) {
    return <div className={className}>{body}</div>
  }

  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onSelect}
      className={className}
    >
      {body}
    </button>
  )
}
