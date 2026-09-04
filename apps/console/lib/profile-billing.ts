/**
 * Profile → Billing presentation helpers (stacked plan cards).
 * Catalog list prices load from Stripe at runtime via consoleBilling.readCatalog.
 */

import {
  BILLING_DISCOUNT_TIMING_COPY,
  BILLING_SOFT_UNAVAILABLE_COPY,
  DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
  PROMO_REMOVE_NO_RESTORE_COPY,
  PROMO_REMOVE_SUCCESS_COPY,
  STAFF_REDEEM_BLOCK_COPY,
  buildDiscountedBillingPriceLabels,
  canRemovePromoDiscount,
  formatCheckoutCtaLabel,
  formatEntitlementClockEndLabel,
  isFreeSubscriptionPlan,
  isPaidDefaultPortalEligible,
  isStaffRedeemBlocked,
  promoCodeLabel,
  replaceConfirmDiscountLabel,
  requiresReplaceConfirm,
  resolveBillingDiscountDisplay,
  resolveProfileBillingCheckoutCta,
  shouldScheduleSubscriptionChangeAtPeriodEnd,
  type BillingCatalogForUserRead,
  type BillingCatalogMinor,
  type BillingDiscountDisplay,
  type BillingPlanPriceLabels,
  type DiscountedBillingPriceLabels,
  type EntitlementBillingInterval,
  type SubscriptionDiscountRead,
} from '@virtality/shared/utils'

/** Section heading and input label for the unified billing code field. */
export const PROFILE_BILLING_CODE_FIELD_LABEL =
  'Promotion or Access Code' as const

export type BillingInterval = EntitlementBillingInterval

export type BillingPlanPrices = BillingPlanPriceLabels

/** Plan-card CTA when a live paid Default seat switches monthly ↔ yearly. */
export const PAID_INTERVAL_UPGRADE_LABEL = 'Upgrade' as const

/** Plan-card CTA when a period-end interval switch is already scheduled. */
export const PAID_INTERVAL_CANCEL_LABEL = 'Cancel' as const

/** Plan-card CTA to undo cancel-at-period-end on the current Default interval. */
export const PAID_CANCELLATION_UNDO_LABEL = "Don't cancel" as const

export type ProfileBillingCardActionConfirm = {
  title: string
  body: string
  confirmLabel: string
}

export type ProfileBillingCardAction =
  | { kind: 'none'; label: null; pendingLabel: null }
  | {
      kind: 'checkout'
      label: string
      pendingLabel: string
    }
  | {
      kind: 'schedule'
      label: string
      pendingLabel: string
      confirm: ProfileBillingCardActionConfirm
    }
  | {
      kind: 'cancel_schedule'
      label: string
      pendingLabel: string
      confirm: ProfileBillingCardActionConfirm
    }
  | {
      kind: 'restore_cancellation'
      label: string
      pendingLabel: string
    }

/** Structured plan-card action kinds; UI dispatches on these, never on label copy. */
export type ProfileBillingCardActionKind = ProfileBillingCardAction['kind']

/** Plan-card action that renders a CTA (excludes inert `none`). */
export type ProfileBillingCardActiveAction = Exclude<
  ProfileBillingCardAction,
  { kind: 'none' }
>

const NONE_ACTION: ProfileBillingCardAction = {
  kind: 'none',
  label: null,
  pendingLabel: null,
}

/** Drop inert `none` actions before wiring plan-card CTAs. */
export function profileBillingCardActiveAction(
  action: ProfileBillingCardAction,
): ProfileBillingCardActiveAction | null {
  return action.kind === 'none' ? null : action
}

/** Confirm dialog copy when the action requires a confirmation step. */
export function profileBillingCardActionConfirm(
  action: ProfileBillingCardAction,
): ProfileBillingCardActionConfirm | null {
  switch (action.kind) {
    case 'schedule':
    case 'cancel_schedule':
      return action.confirm
    default:
      return null
  }
}

export {
  BILLING_DISCOUNT_TIMING_COPY,
  BILLING_SOFT_UNAVAILABLE_COPY,
  DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
  PROMO_REMOVE_NO_RESTORE_COPY,
  PROMO_REMOVE_SUCCESS_COPY,
  STAFF_REDEEM_BLOCK_COPY,
  buildDiscountedBillingPriceLabels,
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

/** Opposite Default interval when a period-end switch is scheduled. */
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
 * Centralized Manage billing CTA. Paid Default seats with a live clock open the
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
  return isPaidDefaultPortalEligible(standing)
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
 * Interval-specific plan-card action. Free / Renew seats share one
 * Subscribe/Renew checkout on both cards. Live paid Default schedules "Upgrade" on
 * the other interval, or "Cancel" when that switch is already scheduled. While
 * cancel-at-period-end is set, the current interval restores ("Don't cancel")
 * and the other interval checkouts "Upgrade" (pay now, not period-end schedule).
 */
export function resolveProfileBillingCardAction(
  standing: BillingStandingView,
  hasStripeCustomer: boolean,
  interval: BillingInterval,
): ProfileBillingCardAction {
  if (profileBillingOpensPortal(standing)) {
    if (standing.cancelAtPeriodEnd) {
      if (standing.billingInterval === interval) {
        return {
          kind: 'restore_cancellation',
          label: PAID_CANCELLATION_UNDO_LABEL,
          pendingLabel: 'Restoring…',
        }
      }
      return {
        kind: 'checkout',
        label: PAID_INTERVAL_UPGRADE_LABEL,
        pendingLabel: 'Upgrading…',
      }
    }
    if (standing.billingInterval === interval) return NONE_ACTION
    const pendingTarget = profileBillingPendingTargetInterval(standing)
    if (pendingTarget != null) {
      if (pendingTarget !== interval) return NONE_ACTION
      const confirm = profileBillingIntervalCancelConfirmCopy(standing)
      if (confirm == null) return NONE_ACTION
      return {
        kind: 'cancel_schedule',
        label: PAID_INTERVAL_CANCEL_LABEL,
        pendingLabel: 'Canceling…',
        confirm,
      }
    }
    return {
      kind: 'schedule',
      label: PAID_INTERVAL_UPGRADE_LABEL,
      pendingLabel: 'Upgrading…',
      confirm: profileBillingIntervalUpgradeConfirmCopy(standing, interval),
    }
  }

  const cta = resolveProfileBillingPlanCardCheckoutCta(
    standing,
    hasStripeCustomer,
  )
  if (cta == null) return NONE_ACTION

  const label =
    !standing.billingPathEstablished && hasStripeCustomer
      ? 'Become a paying customer'
      : formatCheckoutCtaLabel(cta)
  if (label == null) return NONE_ACTION

  return {
    kind: 'checkout',
    label,
    pendingLabel: 'Starting Checkout…',
  }
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
  productName: string = DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
): string | null {
  if (!standing.cancelAtPeriodEnd || !standing.entitled) return null
  if (standing.clockEnd) {
    const when = formatEntitlementClockEndLabel(new Date(standing.clockEnd))
    return `Your subscription ends on ${when}. You'll keep ${productName} access until then.`
  }
  return `Your subscription ends at the next billing cycle. You'll keep ${productName} access until then.`
}

/** Confirm-dialog body for scheduling an interval switch. */
function profileBillingIntervalUpgradeConfirmCopy(
  standing: BillingStandingView,
  targetInterval: BillingInterval,
): ProfileBillingCardActionConfirm {
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
    confirmLabel: PAID_INTERVAL_UPGRADE_LABEL,
  }
}

/** Confirm-dialog body for releasing a scheduled interval switch. */
function profileBillingIntervalCancelConfirmCopy(
  standing: BillingStandingView,
): ProfileBillingCardActionConfirm | null {
  const target = profileBillingPendingTargetInterval(standing)
  if (target == null) return null
  const targetTitle = profileBillingIntervalTitle(target)
  return {
    title: `Cancel switch to ${targetTitle}?`,
    body: `You'll stay on your current plan and renew as usual.`,
    confirmLabel: PAID_INTERVAL_CANCEL_LABEL,
  }
}

/** Free plan seat with no live clock: shown as expired everywhere in Billing. */
export function profileBillingIsExpiredFree(
  standing: Pick<BillingStandingView, 'entitled' | 'plan' | 'status'>,
): boolean {
  if (!isFreeSubscriptionPlan(standing.plan)) return false
  return !(standing.status === 'trialing' && standing.entitled)
}

export function profileBillingStatusHeadline(
  standing: BillingStandingView,
  productName: string = DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
): string {
  if (isFreeSubscriptionPlan(standing.plan)) {
    if (standing.status === 'trialing' && standing.entitled) {
      return 'Trial in progress'
    }
    return 'Expired'
  }

  if (standing.entitled) {
    if (standing.status === 'trialing') return 'Trial in progress'
    if (standing.billingInterval === 'year') return `${productName} · Yearly`
    if (standing.billingInterval === 'month') return `${productName} · Monthly`
    return productName
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
  productName: string = DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
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

  if (standing.entitled) return `Your ${productName} access is active.`

  if (profileBillingIsExpiredFree(standing)) {
    return `Your Free plan has expired. Choose Monthly or Yearly ${productName} to continue.`
  }

  return `Choose Monthly or Yearly ${productName}, then continue to Checkout.`
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

/** Assigned-variant list prices for plan cards (never expose variant names). */
export function billingCatalogPrices(
  catalog: BillingCatalogForUserRead | undefined,
): BillingPlanPrices | null {
  if (!catalog?.ok) return null
  return catalog.assigned.labels
}

/** Assigned-variant minor units for Discount rewrite math. */
export function billingCatalogMinor(
  catalog: BillingCatalogForUserRead | undefined,
): BillingCatalogMinor | undefined {
  if (!catalog?.ok) return undefined
  return catalog.assigned.minor
}

export function billingCatalogShowCompareAt(
  catalog: BillingCatalogForUserRead | undefined,
): boolean {
  return catalog?.ok === true && catalog.showCompareAt
}

export function billingCatalogBasicLabels(
  catalog: BillingCatalogForUserRead | undefined,
): BillingPlanPrices | null {
  if (!catalog?.ok) return null
  return catalog.basic.labels
}

export type BillingCompareAtPriceGroup = {
  primary: string
  secondary: string
}

export type BillingCompareAtMonthlyDiscountLine = {
  discounted: string
  current: string
  interval: string
}

export type BillingCompareAtMonthlyRow =
  | { kind: 'catalog'; price: string }
  | { kind: 'discount-inline'; line: BillingCompareAtMonthlyDiscountLine }
  | { kind: 'struck'; price: string }

export type BillingCompareAtYearlyDiscountLine = {
  discounted: string
  current: string
  interval: string
}

export type BillingCompareAtYearlyRow =
  | { kind: 'catalog'; lines: BillingCompareAtPriceGroup }
  | {
      kind: 'discount-inline'
      primary: BillingCompareAtYearlyDiscountLine
      secondary: BillingCompareAtYearlyDiscountLine
    }
  | { kind: 'struck'; lines: BillingCompareAtPriceGroup }

export type BillingCompareAtCardDisplay = {
  monthlyRows: BillingCompareAtMonthlyRow[]
  yearlyRows: BillingCompareAtYearlyRow[]
}

function yearlyGroupLines(
  labels: BillingPlanPriceLabels,
): BillingCompareAtPriceGroup {
  return {
    primary: labels.yearlyAsMonthlyLabel,
    secondary: labels.yearlyTotalMutedLabel,
  }
}

function buildMonthlyDiscountLine(
  discounted: DiscountedBillingPriceLabels,
  current: BillingPlanPriceLabels,
): BillingCompareAtMonthlyDiscountLine {
  const { amount, interval } = splitCatalogPriceLabel(current.monthlyLabel)
  return {
    discounted: discounted.monthlyAmount,
    current: amount,
    interval,
  }
}

/**
 * Variant A stacked groups: assigned (optionally discounted) then struck basic
 * when `showCompareAt`. Pass `discountPrices` already computed on assigned minor.
 */
export function buildBillingCompareAtCardDisplay(input: {
  assigned: BillingPlanPriceLabels
  basic: BillingPlanPriceLabels
  showCompareAt: boolean
  discountPrices?: DiscountedBillingPriceLabels | null
}): BillingCompareAtCardDisplay {
  const { assigned, basic, showCompareAt, discountPrices } = input

  if (discountPrices) {
    const monthlyRows: BillingCompareAtMonthlyRow[] = [
      {
        kind: 'discount-inline',
        line: buildMonthlyDiscountLine(discountPrices, assigned),
      },
    ]
    if (showCompareAt) {
      monthlyRows.push({ kind: 'struck', price: basic.monthlyLabel })
    }

    const yearlyAsMonthly = splitCatalogPriceLabel(
      assigned.yearlyAsMonthlyLabel,
    )
    const yearlyTotal = splitCatalogPriceLabel(assigned.yearlyTotalMutedLabel)
    const yearlyRows: BillingCompareAtYearlyRow[] = [
      {
        kind: 'discount-inline',
        primary: {
          discounted: discountPrices.yearlyAsMonthlyAmount,
          current: yearlyAsMonthly.amount,
          interval: yearlyAsMonthly.interval,
        },
        secondary: {
          discounted: discountPrices.yearlyTotalAmount,
          current: yearlyTotal.amount,
          interval: yearlyTotal.interval,
        },
      },
    ]
    if (showCompareAt) {
      yearlyRows.push({ kind: 'struck', lines: yearlyGroupLines(basic) })
    }

    return { monthlyRows, yearlyRows }
  }

  if (!showCompareAt) {
    return {
      monthlyRows: [{ kind: 'catalog', price: assigned.monthlyLabel }],
      yearlyRows: [{ kind: 'catalog', lines: yearlyGroupLines(assigned) }],
    }
  }

  return {
    monthlyRows: [
      { kind: 'catalog', price: assigned.monthlyLabel },
      { kind: 'struck', price: basic.monthlyLabel },
    ],
    yearlyRows: [
      { kind: 'catalog', lines: yearlyGroupLines(assigned) },
      { kind: 'struck', lines: yearlyGroupLines(basic) },
    ],
  }
}
