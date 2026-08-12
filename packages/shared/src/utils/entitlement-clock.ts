/**
 * Entitlement Clock read model for Remaining Time, VR soft gate, and Checkout
 * CTA visibility. Uses synced Better Auth Subscription fields only.
 *
 * Clock end: trialing → trialEnd; active → periodEnd; anything else → no live
 * clock (including Checkout `incomplete` before webhook/success sync). Entitled
 * for VR: status ∈ {active, trialing} AND now < clockEnd.
 *
 * Checkout CTA: none while entitled; Subscribe vs Renew when not entitled and
 * Billing Path Established (Renew if subscription history shows a paid period).
 * Profile Billing uses `resolveProfileBillingCheckoutCta` instead (Customer id
 * alone is enough). Abandon leaves soft-expired + CTA; only synced live
 * Subscriptions restore.
 */

import { hasBillingPathEstablished } from './console-session-gate.ts'
import { isLiveEntitlementSubscriptionStatus } from './entitlement-extension.ts'

export type EntitlementClockSubscription = {
  status: string
  trialEnd?: Date | null
  periodEnd?: Date | null
}

export type EntitlementClockStanding = {
  /** Live clock: status is active|trialing and now is strictly before clockEnd. */
  entitled: boolean
  /** End instant when live; null when there is no live clock. */
  clockEnd: Date | null
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

/**
 * Prefer a live (active|trialing) Subscription when several rows exist.
 * Otherwise keep the first row so callers can still see expired history.
 */
export function pickEntitlementSubscription<
  T extends EntitlementClockSubscription,
>(subscriptions: readonly T[]): T | null {
  if (subscriptions.length === 0) return null
  const live = subscriptions.find((sub) =>
    isLiveEntitlementSubscriptionStatus(sub.status),
  )
  return live ?? subscriptions[0] ?? null
}

function expiredClockStanding(status: string | null): EntitlementClockStanding {
  return {
    entitled: false,
    clockEnd: null,
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

  const remainingMs = Math.max(0, clockEnd.getTime() - input.now.getTime())
  const entitled = remainingMs > 0

  return {
    entitled,
    clockEnd: entitled ? clockEnd : null,
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

const PAID_BILLING_STATUSES = new Set([
  'active',
  'past_due',
  'unpaid',
  'paused',
])

/**
 * True when one synced Subscription indicates a completed paid billing period
 * (not only trial-style entitlement that never converted).
 */
function subscriptionImpliesPaidBilling(
  sub: EntitlementClockSubscription,
): boolean {
  if (PAID_BILLING_STATUSES.has(sub.status)) return true
  if (sub.periodEnd == null) return false
  if (sub.trialEnd == null) return true
  return sub.periodEnd.getTime() > sub.trialEnd.getTime()
}

/**
 * True when synced Subscription history indicates a completed paid billing
 * period (not only trial-style entitlement that never converted).
 */
export function hadPaidBillingHistory(
  subscriptions: readonly EntitlementClockSubscription[],
): boolean {
  return subscriptions.some(subscriptionImpliesPaidBilling)
}

/**
 * Checkout CTA visibility: entitled users never see Subscribe/Renew; soft-
 * expired clinicians with Billing Path Established see Subscribe or Renew.
 * Sidebar Subscribe/Renew uses this (Billing Path required).
 */
export function resolveCheckoutCta(input: {
  entitled: boolean
  billingPathEstablished: boolean
  hadPaidBilling: boolean
}): CheckoutCta | null {
  if (input.entitled || !input.billingPathEstablished) return null
  return input.hadPaidBilling ? 'renew' : 'subscribe'
}

/**
 * Profile → Billing Checkout CTA. Unlike sidebar Subscribe/Renew, a Stripe
 * Customer alone is enough to start Checkout even when Billing Path is not
 * established yet (typical tester seat: Customer id, no synced Subscription).
 */
export function resolveProfileBillingCheckoutCta(input: {
  entitled: boolean
  hasStripeCustomer: boolean
  hadPaidBilling: boolean
}): CheckoutCta | null {
  if (input.entitled || !input.hasStripeCustomer) return null
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
   * Subscribe/Renew Checkout CTA. Null while entitled or without Billing Path.
   * Console wires click to Better Auth Stripe Checkout (canonical pro plan).
   */
  checkoutCta: CheckoutCta | null
}

/**
 * One read model for Remaining Time, VR soft gate, and Checkout CTA visibility
 * from synced Subscriptions.
 */
export function buildEntitlementStanding(input: {
  now: Date
  role?: string | null
  subscriptions: readonly EntitlementClockSubscription[]
}): EntitlementStanding {
  const clock = resolveEntitlementClock({
    now: input.now,
    subscription: pickEntitlementSubscription(input.subscriptions),
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
