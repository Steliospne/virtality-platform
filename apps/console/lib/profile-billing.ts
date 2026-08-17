/**
 * Profile → Billing presentation helpers (stacked plan cards).
 * Prices match sandbox canonical Pro Prices (monthly + yearly).
 */

import {
  BILLING_DISCOUNT_TIMING_COPY,
  BILLING_SOFT_UNAVAILABLE_COPY,
  PROMO_REMOVE_NO_RESTORE_COPY,
  PROMO_REMOVE_SUCCESS_COPY,
  STAFF_REDEEM_BLOCK_COPY,
  canRemovePromoDiscount,
  formatCheckoutCtaLabel,
  formatEntitlementClockEndLabel,
  isConsolePromoEligibleStatus,
  isStaffRedeemBlocked,
  promoCodeLabel,
  replaceConfirmDiscountLabel,
  requiresReplaceConfirm,
  resolveBillingDiscountDisplay,
  resolveProfileBillingCheckoutCta,
  type BillingDiscountDisplay,
  type EntitlementBillingInterval,
  type SubscriptionDiscountRead,
} from '@virtality/shared/utils'

export type BillingInterval = EntitlementBillingInterval

export type BillingPlanPrices = {
  monthlyLabel: string
  yearlyAsMonthlyLabel: string
  yearlyTotalMutedLabel: string
  yearlySavingsLabel: string
}

/** Sandbox amounts: pro_monthly €150, pro_yearly €1500 (provisional). */
export const PRO_BILLING_PRICES: BillingPlanPrices = {
  monthlyLabel: '€150 / month',
  yearlyAsMonthlyLabel: '€125 / month',
  yearlyTotalMutedLabel: '€1500 / year',
  yearlySavingsLabel: 'Save ~2 months',
}

export {
  BILLING_DISCOUNT_TIMING_COPY,
  BILLING_SOFT_UNAVAILABLE_COPY,
  PROMO_REMOVE_NO_RESTORE_COPY,
  PROMO_REMOVE_SUCCESS_COPY,
  STAFF_REDEEM_BLOCK_COPY,
  canRemovePromoDiscount,
  isStaffRedeemBlocked,
  promoCodeLabel,
  replaceConfirmDiscountLabel,
  requiresReplaceConfirm,
  resolveBillingDiscountDisplay,
}

export type BillingStandingView = {
  entitled: boolean
  status: string | null
  billingPathEstablished: boolean
  hadPaidBilling: boolean
  billingInterval: BillingInterval | null
  clockEnd: Date | string | null
}

/**
 * Primary CTA on Profile Billing. Entitled seats open Customer Portal;
 * others start Checkout when a Stripe Customer exists.
 */
export function profileBillingPrimaryCtaLabel(
  standing: BillingStandingView,
  hasStripeCustomer: boolean,
): string | null {
  if (standing.entitled) return 'Manage in portal'

  const cta = resolveProfileBillingCheckoutCta({
    entitled: false,
    hasStripeCustomer,
    hadPaidBilling: standing.hadPaidBilling,
  })
  if (cta == null) return null

  if (cta === 'renew') return 'Renew'
  if (!standing.billingPathEstablished) return 'Become a paying customer'
  return formatCheckoutCtaLabel(cta)
}

export function profileBillingOpensPortal(
  standing: Pick<BillingStandingView, 'entitled'>,
): boolean {
  return standing.entitled
}

export function profileBillingStatusHeadline(
  standing: BillingStandingView,
): string {
  if (standing.entitled) {
    if (standing.status === 'trialing') return 'Trial in progress'
    if (standing.billingInterval === 'year') return 'Pro · Yearly'
    if (standing.billingInterval === 'month') return 'Pro · Monthly'
    return 'Pro'
  }

  switch (standing.status) {
    case 'canceled':
      return 'Subscription canceled'
    case null:
    case undefined:
      return 'No plan yet'
    default:
      return 'Entitlement ended'
  }
}

export function profileBillingStatusDetail(
  standing: BillingStandingView,
): string {
  if (standing.clockEnd) {
    const label = formatEntitlementClockEndLabel(new Date(standing.clockEnd))
    if (standing.status === 'trialing') return `Ends ${label}`
    return `Renews ${label}`
  }

  if (standing.entitled) return 'Your Pro access is active.'

  return 'Choose Monthly or Yearly Pro, then continue to Checkout.'
}

/** Redeem / remove chrome only on eligible Subscription statuses (#65 / #72). */
export function profileBillingShowsPromoChrome(
  standing: Pick<BillingStandingView, 'status'>,
): boolean {
  return (
    standing.status != null && isConsolePromoEligibleStatus(standing.status)
  )
}

export function profileBillingDiscountDisplay(
  read: SubscriptionDiscountRead | undefined,
): BillingDiscountDisplay {
  if (!read) return { kind: 'catalog' }
  return resolveBillingDiscountDisplay(read)
}

/** Split catalog label into amount + interval for struck-through rewrite. */
export function splitCatalogPriceLabel(label: string): {
  amount: string
  interval: string
} {
  const match = label.match(/^(.+?)\s+(\/.+)$/)
  if (!match) return { amount: label, interval: '' }
  const amount = match[1]
  const interval = match[2]
  if (amount == null || interval == null) {
    return { amount: label, interval: '' }
  }
  return { amount, interval }
}
