/**
 * Profile → Billing presentation helpers (stacked plan cards).
 * Catalog list prices load from Stripe at runtime via consoleBilling.readCatalog.
 */

import {
  BILLING_DISCOUNT_TIMING_COPY,
  BILLING_SOFT_UNAVAILABLE_COPY,
  PROMO_REMOVE_NO_RESTORE_COPY,
  PROMO_REMOVE_SUCCESS_COPY,
  STAFF_REDEEM_BLOCK_COPY,
  buildDiscountedBillingPriceLabels,
  canRemovePromoDiscount,
  formatCheckoutCtaLabel,
  formatEntitlementClockEndLabel,
  isConsolePromoEligibleStatus,
  isFreeSubscriptionPlan,
  isPaidProPortalEligible,
  isStaffRedeemBlocked,
  promoCodeLabel,
  replaceConfirmDiscountLabel,
  requiresReplaceConfirm,
  resolveBillingDiscountDisplay,
  resolveProfileBillingCheckoutCta,
  type BillingCatalogMinor,
  type BillingCatalogRead,
  type BillingDiscountDisplay,
  type BillingPlanPriceLabels,
  type EntitlementBillingInterval,
  type SubscriptionDiscountRead,
} from '@virtality/shared/utils'

export type BillingInterval = EntitlementBillingInterval

export type BillingPlanPrices = BillingPlanPriceLabels

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
  plan: string | null
  billingPathEstablished: boolean
  hadPaidBilling: boolean
  billingInterval: BillingInterval | null
  clockEnd: Date | string | null
}

function resolveProfileBillingPlanCardCheckoutCta(
  standing: BillingStandingView,
  hasStripeCustomer: boolean,
) {
  return resolveProfileBillingCheckoutCta({
    entitled: standing.entitled,
    hasStripeCustomer,
    hadPaidBilling: standing.hadPaidBilling,
    plan: standing.plan,
    status: standing.status,
  })
}

/**
 * Centralized Manage billing CTA. Paid Pro seats with a live clock open the
 * Customer Portal; Free and trialing clinicians use per-card Checkout instead.
 */
export function profileBillingPrimaryCtaLabel(
  standing: BillingStandingView,
): string | null {
  if (profileBillingOpensPortal(standing)) return 'Manage billing'
  return null
}

export function profileBillingOpensPortal(
  standing: Pick<BillingStandingView, 'entitled' | 'plan' | 'status'>,
): boolean {
  return isPaidProPortalEligible(standing)
}

/** Whether each paid Pro plan card should expose its own Checkout action. */
export function profileBillingShowsPlanCardCheckout(
  standing: BillingStandingView,
  hasStripeCustomer: boolean,
): boolean {
  return (
    resolveProfileBillingPlanCardCheckoutCta(standing, hasStripeCustomer) !=
    null
  )
}

/** Interval-specific Checkout label on a paid Pro plan card. */
export function profileBillingPlanCardCheckoutLabel(
  standing: BillingStandingView,
  hasStripeCustomer: boolean,
): string | null {
  const cta = resolveProfileBillingPlanCardCheckoutCta(
    standing,
    hasStripeCustomer,
  )
  if (cta == null) return null

  if (!standing.billingPathEstablished && hasStripeCustomer) {
    return 'Become a paying customer'
  }
  return formatCheckoutCtaLabel(cta)
}

export function profileBillingStatusHeadline(
  standing: BillingStandingView,
): string {
  if (isFreeSubscriptionPlan(standing.plan)) {
    if (standing.status === 'trialing' && standing.entitled) {
      return 'Trial in progress'
    }
    return 'Free'
  }

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
      return 'Subscription ended'
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
  standing: Pick<BillingStandingView, 'entitled' | 'status'>,
): boolean {
  if (!standing.entitled) return true
  return (
    standing.status != null && isConsolePromoEligibleStatus(standing.status)
  )
}

export function profileBillingDiscountDisplay(
  read: SubscriptionDiscountRead | undefined,
  catalogMinor: BillingCatalogMinor | undefined,
): BillingDiscountDisplay {
  if (!read || !catalogMinor) return { kind: 'catalog' }
  return resolveBillingDiscountDisplay(read, catalogMinor)
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

export type PendingCouponTerms = {
  percentOff: number | null
  amountOff: number | null
}

/** Build a plan-card rewrite from pending coupon terms (pre-subscribe). */
export function buildPendingCouponRewrite(
  terms: PendingCouponTerms,
  catalogMinor: BillingCatalogMinor,
  prices: BillingPlanPriceLabels,
) {
  const discounted = buildDiscountedBillingPriceLabels(terms, catalogMinor)
  return {
    monthly: {
      discountedPrimary: discounted.monthlyAmount,
      listStrike: prices.monthlyLabel,
    },
    yearly: {
      discountedPrimary: discounted.yearlyAsMonthlyAmount,
      listStrike: prices.yearlyAsMonthlyLabel,
      discountedMuted: discounted.yearlyTotalAmount,
      listStrikeMuted: prices.yearlyTotalMutedLabel,
    },
  }
}

export function billingCatalogPrices(
  catalog: BillingCatalogRead | undefined,
): BillingPlanPrices | null {
  if (!catalog?.ok) return null
  return catalog.labels
}

export function billingCatalogMinor(
  catalog: BillingCatalogRead | undefined,
): BillingCatalogMinor | undefined {
  if (!catalog?.ok) return undefined
  return catalog.minor
}
