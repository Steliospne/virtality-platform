'use client'

/**
 * Monthly/Yearly Pro plan card with optional Discount price rewrite.
 */

import { Check } from 'lucide-react'
import { Badge } from '@virtality/ui/components/badge'
import { cn } from '@/lib/utils'
import { splitCatalogPriceLabel } from '@/lib/profile-billing'

type PlanPriceRewrite = {
  discountedPrimary: string
  listStrike: string
  discountedMuted?: string
  listStrikeMuted?: string
}

function PriceLine({
  primary,
  strike,
  primaryClassName = 'text-lg font-semibold',
  catalogClassName = 'text-lg font-semibold',
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
    <div className='flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5'>
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
  if (rewrite) {
    return (
      <>
        <PriceLine
          primary={rewrite.discountedPrimary}
          strike={rewrite.listStrike}
        />
        {rewrite.discountedMuted ? (
          <div className='mt-0.5'>
            <PriceLine
              primary={rewrite.discountedMuted}
              strike={rewrite.listStrikeMuted}
              primaryClassName='text-sm font-medium'
              catalogClassName='text-sm font-medium'
            />
          </div>
        ) : null}
      </>
    )
  }

  return (
    <>
      <p className='text-lg font-semibold tabular-nums'>{listPrimary}</p>
      {listMuted ? (
        <p className='mt-0.5 text-sm text-zinc-400 tabular-nums'>{listMuted}</p>
      ) : null}
    </>
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
  rewrite,
}: {
  title: string
  description: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
  listPrimary: string
  listMuted?: string
  badge?: string
  rewrite: PlanPriceRewrite | null
}) {
  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'rounded-xl border-2 p-5 text-left transition',
        selected
          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800',
        disabled && 'opacity-60',
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-lg font-semibold'>{title}</p>
            {badge ? <Badge>{badge}</Badge> : null}
          </div>
          <p className='mt-1 text-sm text-zinc-500'>{description}</p>
        </div>
        <div className='text-right'>
          <PlanCardPrices
            listPrimary={listPrimary}
            listMuted={listMuted}
            rewrite={rewrite}
          />
        </div>
      </div>
      {selected ? (
        <p className='mt-3 flex items-center gap-1.5 text-sm font-medium'>
          <Check className='size-4' /> Selected
        </p>
      ) : null}
    </button>
  )
}
