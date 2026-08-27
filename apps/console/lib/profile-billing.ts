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
  shouldScheduleSubscriptionChangeAtPeriodEnd,
  type BillingCatalogMinor,
  type BillingCatalogRead,
  type BillingDiscountDisplay,
  type BillingPlanPriceLabels,
  type EntitlementBillingInterval,
  type SubscriptionDiscountRead,
} from '@virtality/shared/utils'

export type BillingInterval = EntitlementBillingInterval

export type BillingPlanPrices = BillingPlanPriceLabels

/** Plan-card CTA when a live paid Pro seat switches monthly ↔ yearly. */
export const PAID_INTERVAL_UPDATE_LABEL = 'Update' as const

/** Plan-card CTA when a period-end interval switch is already scheduled. */
export const PAID_INTERVAL_CANCEL_LABEL = 'Cancel' as const

/** Plan-card CTA to undo cancel-at-period-end on the current Pro interval. */
export const PAID_CANCELLATION_UNDO_LABEL = "Don't cancel" as const

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
  shouldScheduleSubscriptionChangeAtPeriodEnd,
}

export type BillingStandingView = {
  entitled: boolean
  status: string | null
  plan: string | null
  billingPathEstablished: boolean
  hadPaidBilling: boolean
  billingInterval: BillingInterval | null
  clockEnd: Date | string | null
  /** Stripe schedule queued for period-end interval switch. */
  hasPendingPlanChange: boolean
  /** Stripe cancel-at-period-end on the live seat. */
  cancelAtPeriodEnd: boolean
}

export function profileBillingIntervalTitle(
  interval: BillingInterval,
): 'Monthly' | 'Yearly' {
  return interval === 'year' ? 'Yearly' : 'Monthly'
}

/** Opposite Pro interval when a period-end switch is scheduled. */
export function profileBillingPendingTargetInterval(
  standing: Pick<
    BillingStandingView,
    'hasPendingPlanChange' | 'billingInterval'
  >,
): BillingInterval | null {
  if (!standing.hasPendingPlanChange || standing.billingInterval == null) {
    return null
  }
  return standing.billingInterval === 'month' ? 'year' : 'month'
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

/** Whether plan cards should expose Checkout / interval-switch actions. */
export function profileBillingShowsPlanCardCheckout(
  standing: BillingStandingView,
  hasStripeCustomer: boolean,
): boolean {
  if (profileBillingOpensPortal(standing)) return true
  return (
    resolveProfileBillingPlanCardCheckoutCta(standing, hasStripeCustomer) !=
    null
  )
}

/**
 * Interval-specific plan-card action label. Free / Renew seats share one
 * Subscribe/Renew label on both cards. Live paid Pro shows "Update" on the
 * other interval, or "Cancel" when that switch is already scheduled. While
 * cancel-at-period-end is set, the current interval offers "Don't cancel" and
 * the other interval still offers "Update" (Checkout to pay for that plan).
 */
export function profileBillingPlanCardCheckoutLabel(
  standing: BillingStandingView,
  hasStripeCustomer: boolean,
  interval?: BillingInterval,
): string | null {
  if (profileBillingOpensPortal(standing)) {
    if (interval == null) return null
    if (standing.cancelAtPeriodEnd) {
      return standing.billingInterval === interval
        ? PAID_CANCELLATION_UNDO_LABEL
        : PAID_INTERVAL_UPDATE_LABEL
    }
    if (standing.billingInterval === interval) return null
    const pendingTarget = profileBillingPendingTargetInterval(standing)
    if (pendingTarget != null) {
      return pendingTarget === interval ? PAID_INTERVAL_CANCEL_LABEL : null
    }
    return PAID_INTERVAL_UPDATE_LABEL
  }

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

/** Whether an upgrade from this standing should schedule at period end. */
export function profileBillingSchedulesAtPeriodEnd(
  standing: Pick<
    BillingStandingView,
    'plan' | 'entitled' | 'status' | 'cancelAtPeriodEnd'
  >,
): boolean {
  if (standing.cancelAtPeriodEnd) return false
  return (
    profileBillingOpensPortal(standing) &&
    shouldScheduleSubscriptionChangeAtPeriodEnd(standing.plan)
  )
}

/** Banner copy while a period-end interval switch is scheduled. */
export function profileBillingPendingPlanChangeBanner(
  standing: BillingStandingView,
): string | null {
  const target = profileBillingPendingTargetInterval(standing)
  if (target == null) return null

  const targetTitle = profileBillingIntervalTitle(target)
  if (standing.clockEnd) {
    const when = formatEntitlementClockEndLabel(new Date(standing.clockEnd))
    return `Switching to ${targetTitle} on ${when}. Keep your current plan until then. Payment starts at that renewal.`
  }
  return `Switching to ${targetTitle} at your next billing cycle. Keep your current plan until then.`
}

/** Warning banner while cancel-at-period-end is scheduled. */
export function profileBillingPendingCancellationBanner(
  standing: BillingStandingView,
): string | null {
  if (!standing.cancelAtPeriodEnd || !standing.entitled) return null
  if (standing.clockEnd) {
    const when = formatEntitlementClockEndLabel(new Date(standing.clockEnd))
    return `Your subscription ends on ${when}. You'll keep Pro access until then.`
  }
  return `Your subscription ends at the next billing cycle. You'll keep Pro access until then.`
}

/** Confirm-dialog body for scheduling an interval switch. */
export function profileBillingIntervalUpdateConfirmCopy(
  standing: BillingStandingView,
  targetInterval: BillingInterval,
): { title: string; body: string; confirmLabel: string } {
  const targetTitle = profileBillingIntervalTitle(targetInterval)
  const currentTitle =
    standing.billingInterval != null
      ? profileBillingIntervalTitle(standing.billingInterval)
      : 'current plan'
  const when = standing.clockEnd
    ? formatEntitlementClockEndLabel(new Date(standing.clockEnd))
    : null

  return {
    title: `Switch to ${targetTitle}?`,
    body: when
      ? `Payment starts at your next billing cycle on ${when}. Keep using ${currentTitle} until then.`
      : `Payment starts at your next billing cycle. Keep using ${currentTitle} until then.`,
    confirmLabel: PAID_INTERVAL_UPDATE_LABEL,
  }
}

/** Confirm-dialog body for releasing a scheduled interval switch. */
export function profileBillingIntervalCancelConfirmCopy(
  standing: BillingStandingView,
): { title: string; body: string; confirmLabel: string } | null {
  const target = profileBillingPendingTargetInterval(standing)
  if (target == null) return null
  const targetTitle = profileBillingIntervalTitle(target)
  return {
    title: `Cancel switch to ${targetTitle}?`,
    body: `You'll stay on your current plan and renew as usual.`,
    confirmLabel: PAID_INTERVAL_CANCEL_LABEL,
  }
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
    if (standing.cancelAtPeriodEnd) return `Ends ${label}`
    if (standing.hasPendingPlanChange) {
      const target = profileBillingPendingTargetInterval(standing)
      if (target != null) {
        return `Renews ${label} · switching to ${profileBillingIntervalTitle(target)}`
      }
    }
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
