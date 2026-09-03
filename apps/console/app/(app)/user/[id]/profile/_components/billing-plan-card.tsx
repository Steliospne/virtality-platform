'use client'

/**
 * Monthly/Yearly Default plan card with Assigned Variant compare-at rows.
 */

import { Check } from 'lucide-react'
import { Badge } from '@virtality/ui/components/badge'
import { cn } from '@/lib/utils'
import type {
  BillingCompareAtMonthlyRow,
  BillingCompareAtYearlyRow,
  ProfileBillingCardActiveAction,
} from '@/lib/profile-billing'
import { BillingPlanCardCheckoutButton } from './billing-plan-card-checkout-button'
import { BillingCompareAtMonthlyPrice } from './billing-compare-at-monthly-price'
import { BillingCompareAtYearlyPrice } from './billing-compare-at-yearly-price'

export function PlanCard({
  title,
  selected,
  disabled,
  onSelect,
  monthlyRows,
  yearlyRows,
  badge,
  accent = false,
  checkoutAction,
  checkoutPending,
  onCheckout,
}: {
  title: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
  monthlyRows?: BillingCompareAtMonthlyRow[]
  yearlyRows?: BillingCompareAtYearlyRow[]
  badge?: string
  accent?: boolean
  checkoutAction?: ProfileBillingCardActiveAction | null
  checkoutPending?: boolean
  onCheckout?: () => void
}) {
  const hasCheckout = checkoutAction != null && onCheckout != null
  // Active interval (`disabled`): not selectable and not "Selected"; just inert.
  const interactive = !hasCheckout && !disabled
  const showSelected = selected && !disabled
  const className = cn(
    'flex h-full min-h-56 flex-col rounded-xl border-2 p-6 text-left transition sm:min-h-64 sm:p-7',
    accent
      ? showSelected
        ? 'border-vital-blue-600 bg-vital-blue-50 dark:border-vital-blue-400 dark:bg-vital-blue-950/40'
        : 'border-vital-blue-200 bg-vital-blue-50/60 dark:border-vital-blue-800 dark:bg-vital-blue-950/20'
      : showSelected
        ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
        : 'border-zinc-200 dark:border-zinc-800',
  )
  const body = (
    <>
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

      <div className='mt-6 min-h-16'>
        {monthlyRows ? (
          <BillingCompareAtMonthlyPrice rows={monthlyRows} />
        ) : yearlyRows ? (
          <BillingCompareAtYearlyPrice rows={yearlyRows} />
        ) : null}
      </div>
      {showSelected && !hasCheckout ? (
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
            kind={checkoutAction.kind}
            label={checkoutAction.label}
            pendingLabel={checkoutAction.pendingLabel}
            pending={checkoutPending ?? false}
            onCheckout={onCheckout}
          />
        </div>
      ) : null}
    </>
  )

  if (!interactive) {
    return <div className={className}>{body}</div>
  }

  return (
    <button type='button' onClick={onSelect} className={className}>
      {body}
    </button>
  )
}
