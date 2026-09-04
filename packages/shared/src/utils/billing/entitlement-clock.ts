/**
 * Entitlement Clock read model for Remaining Time, VR soft gate, and Checkout
 * CTA visibility. Uses synced Better Auth Subscription fields only.
 *
 * Clock end: trialing → trialEnd; active → periodEnd; anything else → no live
 * clock (including Checkout `incomplete` before webhook/success sync). Entitled
 * for VR: status ∈ {active, trialing} AND now < clockEnd.
 *
 * Checkout CTA: none while entitled paid Default (portal seats); Subscribe vs Renew
 * for soft-expired clinicians and live Free trials when Billing Path Established
 * (Renew if subscription history shows a paid period).
 * Profile Billing uses `resolveProfileBillingCheckoutCta` instead (Customer id
 * alone is enough). Abandon leaves soft-expired + CTA; only synced live
 * Subscriptions restore.
 */

import {
  isFreeSubscriptionPlan,
  isDefaultSubscriptionPlan,
} from './billing-plans.ts'
import { hasBillingPathEstablished } from './console-session-gate.ts'
import { resolveExpiredFreeUpgradeQualifies } from './expired-free-upgrade-prompt.ts'
import { isLiveEntitlementSubscriptionStatus } from './entitlement-extension.ts'
import { hadPaidBillingHistory } from './paid-billing-history.ts'
import {
  resolveEntitlementFromSources,
  type TrialGrantClock,
} from './trial-grant.ts'

export type EntitlementBillingInterval = 'month' | 'year'

export type EntitlementClockSubscription = {
  status: string
  /** Synced Better Auth plan (`free` | `pro`); Free active seats are not entitled. */
  plan?: string | null
  trialStart?: Date | null
  trialEnd?: Date | null
  periodStart?: Date | null
  periodEnd?: Date | null
  /** Synced Stripe/Better Auth interval when known (`month` / `year`). */
  billingInterval?: string | null
  /**
   * Better Auth / Stripe subscription schedule id when a plan change is queued
   * for period end (`scheduleAtPeriodEnd`).
   */
  stripeScheduleId?: string | null
  /** Synced Stripe cancel-at-period-end flag on the Subscription row. */
  cancelAtPeriodEnd?: boolean | null
}

export type EntitlementClockStanding = {
  /** Live clock: status is active|trialing and now is strictly before clockEnd. */
  entitled: boolean
  /** End instant when live; null when there is no live clock. */
  clockEnd: Date | null
  /**
   * Epoch start (trial/period start) when live; null when there is no live
   * clock. Used to tell "offset window fits inside this epoch" apart from
   * "we missed checking it partway through a valid window" (renew prompts).
   */
  clockStart: Date | null
  /** Milliseconds until clockEnd, floored at 0 (never negative). */
  remainingMs: number
  /** Live status when entitled; otherwise the input status or null. */
  status: string | null
}

export function clockEndForSubscriptionStatus(
  status: string,
  trialEnd: Date | null | undefined,
  periodEnd: Date | null | undefined,
): Date | null {
  switch (status) {
    case 'trialing':
      return trialEnd ?? null
    case 'active':
      return periodEnd ?? null
    default:
      return null
  }
}

export function clockStartForSubscriptionStatus(
  status: string,
  trialStart: Date | null | undefined,
  periodStart: Date | null | undefined,
): Date | null {
  switch (status) {
    case 'trialing':
      return trialStart ?? null
    case 'active':
      return periodStart ?? null
    default:
      return null
  }
}

/**
 * Prefer a live (active|trialing) Subscription when several rows exist.
 * Paid (non-free) seats win over live Free trials when both are present.
 * Otherwise keep the first row so callers can still see expired history.
 */
export function pickEntitlementSubscription<
  T extends EntitlementClockSubscription,
>(subscriptions: readonly T[]): T | null {
  if (subscriptions.length === 0) return null

  const live = subscriptions.filter((sub) =>
    isLiveEntitlementSubscriptionStatus(sub.status),
  )
  if (live.length > 0) {
    return (
      live.find((sub) => !isFreeSubscriptionPlan(sub.plan)) ?? live[0] ?? null
    )
  }

  return subscriptions[0] ?? null
}

function expiredClockStanding(status: string | null): EntitlementClockStanding {
  return {
    entitled: false,
    clockEnd: null,
    clockStart: null,
    remainingMs: 0,
    status,
  }
}

export function resolveEntitlementClock(input: {
  now: Date
  subscription: EntitlementClockSubscription | null
}): EntitlementClockStanding {
  const subscription = input.subscription
  if (!subscription) {
    return expiredClockStanding(null)
  }

  if (
    subscription.status === 'active' &&
    isFreeSubscriptionPlan(subscription.plan)
  ) {
    return expiredClockStanding(subscription.status)
  }

  const clockEnd = clockEndForSubscriptionStatus(
    subscription.status,
    subscription.trialEnd,
    subscription.periodEnd,
  )

  if (
    !isLiveEntitlementSubscriptionStatus(subscription.status) ||
    clockEnd == null
  ) {
    return expiredClockStanding(subscription.status)
  }

  const clockStart = clockStartForSubscriptionStatus(
    subscription.status,
    subscription.trialStart,
    subscription.periodStart,
  )

  const remainingMs = Math.max(0, clockEnd.getTime() - input.now.getTime())
  const entitled = remainingMs > 0

  return {
    entitled,
    clockEnd: entitled ? clockEnd : null,
    clockStart: entitled ? clockStart : null,
    remainingMs,
    status: subscription.status,
  }
}

/**
 * Client-side Remaining Time from a known clock end. Never negative.
 */
export function remainingMsFromClockEnd(
  clockEnd: Date | string | null | undefined,
  now: Date | number,
): number {
  if (clockEnd == null) return 0
  const endMs = new Date(clockEnd).getTime()
  if (Number.isNaN(endMs)) return 0
  const nowMs = typeof now === 'number' ? now : now.getTime()
  return Math.max(0, endMs - nowMs)
}

/** Whether VR program launch is allowed for this standing and role. */
export function canLaunchVrPrograms(input: {
  entitled: boolean
  role?: string | null
}): boolean {
  if (input.role === 'admin' || input.role === 'tester') return true
  return input.entitled
}

/** Subscribe vs Renew Checkout CTA; null when CTA is hidden. */
export type CheckoutCta = 'subscribe' | 'renew'

/**
 * Checkout CTA visibility for the sidebar: requires Billing Path Established,
 * hides the CTA for entitled non-trial seats, then defers Subscribe/Renew to
 * {@link resolveProfileBillingCheckoutCta}.
 */
export function resolveCheckoutCta(input: {
  entitled: boolean
  billingPathEstablished: boolean
  hadPaidBilling: boolean
  plan?: string | null
  status?: string | null
}): CheckoutCta | null {
  if (!input.billingPathEstablished) return null
  if (input.entitled && input.status !== 'trialing') return null
  return resolveProfileBillingCheckoutCta({
    entitled: input.entitled,
    hasStripeCustomer: true,
    hadPaidBilling: input.hadPaidBilling,
    plan: input.plan,
    status: input.status,
  })
}

/**
 * Profile → Billing Customer Portal eligibility: live paid Default only. Free and
 * trialing clinicians upgrade through per-card Checkout instead.
 */
export function isPaidDefaultPortalEligible(input: {
  plan?: string | null
  entitled: boolean
  status?: string | null
}): boolean {
  if (!input.entitled) return false
  if (!isDefaultSubscriptionPlan(input.plan)) return false
  return isLiveEntitlementSubscriptionStatus(input.status ?? '')
}

/**
 * Profile → Billing Checkout CTA. Unlike sidebar Subscribe/Renew, a Stripe
 * Customer alone is enough to start Checkout even when Billing Path is not
 * established yet (typical tester seat: Customer id, no synced Subscription).
 * Entitled paid Default seats use the portal instead; Free trial seats stay on
 * Subscribe even while their clock is live.
 */
export function resolveProfileBillingCheckoutCta(input: {
  entitled: boolean
  hasStripeCustomer: boolean
  hadPaidBilling: boolean
  plan?: string | null
  status?: string | null
}): CheckoutCta | null {
  // For Profile Billing, we allow Subscribe even when the console user does not
  // yet have a stored Stripe Customer id. Stripe/Better Auth can create the
  // customer as part of the Stripe Checkout flow.
  if (isPaidDefaultPortalEligible(input)) return null
  return input.hadPaidBilling ? 'renew' : 'subscribe'
}

/** Clinician-facing CTA label; null when the CTA is hidden. */
export function formatCheckoutCtaLabel(
  cta: CheckoutCta | null | undefined,
): string | null {
  switch (cta) {
    case 'subscribe':
      return 'Subscribe'
    case 'renew':
      return 'Renew'
    default:
      return null
  }
}

export type EntitlementStanding = EntitlementClockStanding & {
  /** VR soft gate including admin/tester bypass. */
  canLaunchVr: boolean
  /** Billing Path Established: ≥1 synced Subscription (any status). */
  billingPathEstablished: boolean
  /** Prior paid billing period in synced Subscription history. */
  hadPaidBilling: boolean
  /**
   * Subscribe/Renew Checkout CTA. Null for entitled paid Default, without Billing
   * Path, or while renewing paid active. Live Free trials and soft-expired seats
   * show Subscribe/Renew. Console wires click to Better Auth Stripe Checkout.
   */
  checkoutCta: CheckoutCta | null
  /** Interval on the picked Subscription when known. */
  billingInterval: EntitlementBillingInterval | null
  /** Synced plan on the picked Subscription (`free` | `pro`). */
  plan: string | null
  /**
   * Live paid Default has a Stripe schedule for a plan/interval change at period
   * end (Better Auth `scheduleAtPeriodEnd`).
   */
  hasPendingPlanChange: boolean
  /**
   * Live seat is scheduled to cancel at period end (`cancel_at_period_end`).
   * Still entitled until clockEnd; Console can offer restore ("Don't cancel").
   */
  cancelAtPeriodEnd: boolean
  /** Expired Free / canceled upgrade dialog eligibility (not trialing or paid). */
  expiredFreeUpgradeQualifies: boolean
}

/** Normalize synced interval strings to month/year when recognizable. */
export function normalizeBillingInterval(
  value: string | null | undefined,
): EntitlementBillingInterval | null {
  if (value === 'month' || value === 'year') return value
  return null
}

/**
 * One read model for Remaining Time, VR soft gate, and Checkout CTA visibility
 * from synced Subscriptions.
 */
export function buildEntitlementStanding(input: {
  now: Date
  role?: string | null
  subscriptions: readonly EntitlementClockSubscription[]
  trialGrant?: TrialGrantClock | null
}): EntitlementStanding {
  const subscription = pickEntitlementSubscription(input.subscriptions)
  const clock = resolveEntitlementFromSources({
    now: input.now,
    subscriptions: input.subscriptions,
    trialGrant: input.trialGrant,
  })
  const billingPathEstablished = hasBillingPathEstablished(input.subscriptions)
  const hadPaidBilling = hadPaidBillingHistory(input.subscriptions)
  return {
    ...clock,
    canLaunchVr: canLaunchVrPrograms({
      entitled: clock.entitled,
      role: input.role,
    }),
    billingPathEstablished,
    hadPaidBilling,
    checkoutCta: resolveCheckoutCta({
      entitled: clock.entitled,
      billingPathEstablished,
      hadPaidBilling,
      plan: subscription?.plan,
      status: clock.status,
    }),
    billingInterval: normalizeBillingInterval(subscription?.billingInterval),
    plan: subscription?.plan ?? null,
    hasPendingPlanChange: Boolean(subscription?.stripeScheduleId),
    cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
    expiredFreeUpgradeQualifies: resolveExpiredFreeUpgradeQualifies({
      now: input.now,
      subscriptions: input.subscriptions,
    }),
  }
}

/**
 * Console sidebar Remaining Time: live trialing seats and entitled seats
 * scheduled to cancel at period end (paid active still inside the period),
 * plus Free seats — always shown as expired (0d, red) since Free never
 * carries a live clock. Renewing paid active and other expired seats hide it.
 */
export function showsRemainingTimeSidebar(input: {
  entitled: boolean
  status: string | null | undefined
  cancelAtPeriodEnd?: boolean | null
  plan?: string | null
}): boolean {
  if (isFreeSubscriptionPlan(input.plan)) return true
  if (!input.entitled) return false

  const isTrialing = input.status === 'trialing'
  const isScheduledToCancel = Boolean(input.cancelAtPeriodEnd)
  return isTrialing || isScheduledToCancel
}

/**
 * Live Entitlement Standing: synced Entitlement Standing plus display fields
 * re-evaluated at a client `now` (Remaining Time label, Checkout CTA label,
 * sidebar visibility).
 */
export type LiveEntitlementStanding = EntitlementStanding & {
  /** Clinician-facing Remaining Time label. */
  label: string
  /** Clinician-facing Checkout CTA label; null when hidden. */
  checkoutCtaLabel: string | null
  /** Whether the Remaining Time sidebar chrome should render. */
  showRemainingTime: boolean
}

/** Safe defaults when no synced standing is available yet. */
function emptyEntitlementStanding(): EntitlementStanding {
  return {
    entitled: false,
    clockEnd: null,
    clockStart: null,
    remainingMs: 0,
    status: null,
    canLaunchVr: false,
    billingPathEstablished: false,
    hadPaidBilling: false,
    checkoutCta: null,
    billingInterval: null,
    plan: null,
    hasPendingPlanChange: false,
    cancelAtPeriodEnd: false,
    expiredFreeUpgradeQualifies: false,
  }
}

/**
 * Project Live Entitlement Standing from a synced standing + client `now`.
 * Synced flags pass through; remainingMs / entitled / canLaunchVr /
 * checkoutCta and display labels overwrite server-`now` values. Nullish
 * standing yields safe defaults; admin/tester still bypass the VR soft gate.
 */
export function projectLiveEntitlementStanding(input: {
  standing: EntitlementStanding | null | undefined
  now: Date | number
  role?: string | null
}): LiveEntitlementStanding {
  const standing = input.standing ?? emptyEntitlementStanding()
  const remainingMs = remainingMsFromClockEnd(standing.clockEnd, input.now)
  const entitled = remainingMs > 0
  const checkoutCta = resolveCheckoutCta({
    entitled,
    billingPathEstablished: standing.billingPathEstablished,
    hadPaidBilling: standing.hadPaidBilling,
    plan: standing.plan,
    status: standing.status,
  })

  return {
    ...standing,
    remainingMs,
    entitled,
    canLaunchVr: canLaunchVrPrograms({ entitled, role: input.role }),
    checkoutCta,
    label: formatRemainingTimeLabel(remainingMs),
    checkoutCtaLabel: formatCheckoutCtaLabel(checkoutCta),
    showRemainingTime: showsRemainingTimeSidebar({
      entitled,
      status: standing.status,
      cancelAtPeriodEnd: standing.cancelAtPeriodEnd,
      plan: standing.plan,
    }),
  }
}

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

/**
 * Clinician-facing Remaining Time label. Expired / zero stays non-negative.
 * Surrounding chrome may stay [COPY].
 */
export function formatRemainingTimeLabel(remainingMs: number): string {
  const ms = Math.max(0, Math.floor(remainingMs))
  if (ms <= 0) return 'Expired'

  const days = Math.floor(ms / MS_PER_DAY)
  const hours = Math.floor((ms % MS_PER_DAY) / MS_PER_HOUR)
  const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE)

  if (days > 0) {
    if (hours > 0) return `${days}d ${hours}h`
    return `${days}d`
  }
  if (hours > 0) {
    if (minutes > 0) return `${hours}h ${minutes}m`
    return `${hours}h`
  }
  return `${Math.max(1, minutes)}m`
}

/**
 * Human-readable Entitlement Clock end for renew email / chrome.
 * Always UTC so the label matches Stripe period boundaries.
 */
export function formatEntitlementClockEndLabel(clockEnd: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(clockEnd)
}
