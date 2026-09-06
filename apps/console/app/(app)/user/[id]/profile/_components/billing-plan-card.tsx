'use client'

/**
 * Monthly/Yearly Default plan card with Assigned Variant compare-at rows.
 */

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
  // Active interval (`disabled`): not selectable; just inert.
  const interactive = !hasCheckout && !disabled
  const className = cn(
    'flex h-full min-h-56 flex-col rounded-xl border-2 p-6 text-left transition sm:min-h-64 sm:p-7',
    accent
      ? 'border-vital-blue-600 bg-vital-blue-50 dark:border-vital-blue-400 dark:bg-vital-blue-950/40'
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
