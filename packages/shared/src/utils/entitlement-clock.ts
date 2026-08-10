/**
 * Entitlement Clock read model for Remaining Time, VR soft gate, and (later)
 * Checkout CTA visibility. Uses synced Better Auth Subscription fields only.
 *
 * Clock end: trialing → trialEnd; active → periodEnd; anything else → no live
 * clock. Entitled for VR: status ∈ {active, trialing} AND now < clockEnd.
 */

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

export type EntitlementStanding = EntitlementClockStanding & {
  /** VR soft gate including admin/tester bypass. */
  canLaunchVr: boolean
}

/**
 * One read model for Remaining Time + VR soft gate from synced Subscriptions.
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
  return {
    ...clock,
    canLaunchVr: canLaunchVrPrograms({
      entitled: clock.entitled,
      role: input.role,
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
