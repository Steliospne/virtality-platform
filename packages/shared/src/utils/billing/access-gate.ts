import type { EntitlementClockStanding } from './entitlement-clock.ts'
import {
  clockEndForSubscriptionStatus,
  pickEntitlementSubscription,
  resolveEntitlementClock,
  type EntitlementClockSubscription,
} from './entitlement-clock.ts'
import { isDefaultSubscriptionPlan } from './billing-plans.ts'

export const ACCESS_GATE_STATUSES = [
  'granted',
  'trialing',
  'converted',
  'revoked',
] as const

export type AccessGateStatus = (typeof ACCESS_GATE_STATUSES)[number]

/** Open Access Gates may still be adjusted or revoked. */
export const ACCESS_GATE_OPEN_STATUSES = ['granted', 'trialing'] as const

export type AccessGateOpenStatus = (typeof ACCESS_GATE_OPEN_STATUSES)[number]

export function isAccessGateOpenStatus(
  value: string,
): value is AccessGateOpenStatus {
  return (ACCESS_GATE_OPEN_STATUSES as readonly string[]).includes(value)
}

/** Narrow open set for self-serve Access Code redemption blocking. */
export function isOpenTimedAccessGate(
  accessGate: AccessGateClock | null | undefined,
): boolean {
  return accessGate?.status === 'trialing'
}

export function isOpenGrantedAccessGate(
  accessGate: AccessGateClock | null | undefined,
): boolean {
  return accessGate?.status === 'granted'
}

export type AccessGateClock = {
  status: AccessGateStatus
  trialStart: Date | null
  trialEnd: Date | null
}

export type AccessGateRecord = AccessGateClock & {
  id: string
  userId: string
}

export function toAccessGateClock(row: {
  status: AccessGateStatus | string
  trialStart: Date | null
  trialEnd: Date | null
}): AccessGateClock {
  return {
    status: row.status as AccessGateStatus,
    trialStart: row.trialStart,
    trialEnd: row.trialEnd,
  }
}

export function accessGateStatusForIssue(
  trialEnd: Date | null,
): AccessGateOpenStatus {
  return trialEnd == null ? 'granted' : 'trialing'
}

function expiredAccessGateStanding(
  status: string | null,
): EntitlementClockStanding {
  return {
    entitled: false,
    clockEnd: null,
    clockStart: null,
    remainingMs: 0,
    status,
  }
}

function userHasLivePaidDefaultSubscriptionForEntitlement(
  subscriptions: readonly EntitlementClockSubscription[],
): boolean {
  const subscription = pickEntitlementSubscription(subscriptions)
  if (!subscription) return false
  return (
    subscription.status === 'active' &&
    isDefaultSubscriptionPlan(subscription.plan)
  )
}

/**
 * Access Gate standing: only `trialing` with a future clock end entitles VR
 * launch. `granted`, `converted`, `revoked`, and lapsed `trialing` do not.
 */
export function resolveAccessGateClock(input: {
  now: Date
  accessGate: AccessGateClock | null
}): EntitlementClockStanding {
  const gate = input.accessGate
  if (!gate || gate.status !== 'trialing') {
    return expiredAccessGateStanding(gate?.status ?? null)
  }

  if (gate.trialStart == null || gate.trialEnd == null) {
    return expiredAccessGateStanding('trialing')
  }

  const clockEnd = gate.trialEnd
  const remainingMs = Math.max(0, clockEnd.getTime() - input.now.getTime())
  const entitled = remainingMs > 0

  return {
    entitled,
    clockEnd: entitled ? clockEnd : null,
    clockStart: entitled ? gate.trialStart : null,
    remainingMs,
    status: 'trialing',
  }
}

export function clockEndForAccessGate(
  accessGate: AccessGateClock | null | undefined,
): Date | null {
  if (!accessGate || accessGate.status !== 'trialing') return null
  return accessGate.trialEnd ?? null
}

export function resolveEntitlementFromSources(input: {
  now: Date
  subscriptions: readonly EntitlementClockSubscription[]
  accessGate?: AccessGateClock | null
  /** @deprecated Use `accessGate`. */
  trialGrant?: AccessGateClock | null
}): EntitlementClockStanding {
  if (userHasLivePaidDefaultSubscriptionForEntitlement(input.subscriptions)) {
    const subscription = pickEntitlementSubscription(input.subscriptions)
    return resolveEntitlementClock({
      now: input.now,
      subscription,
    })
  }

  return resolveAccessGateClock({
    now: input.now,
    accessGate: input.accessGate ?? input.trialGrant ?? null,
  })
}

export function clockEndForEntitlementSource(input: {
  subscriptions: readonly EntitlementClockSubscription[]
  accessGate?: AccessGateClock | null
  /** @deprecated Use `accessGate`. */
  trialGrant?: AccessGateClock | null
}): Date | null {
  if (userHasLivePaidDefaultSubscriptionForEntitlement(input.subscriptions)) {
    const subscription = pickEntitlementSubscription(input.subscriptions)
    if (!subscription) return null
    return clockEndForSubscriptionStatus(
      subscription.status,
      subscription.trialEnd,
      subscription.periodEnd,
    )
  }

  return clockEndForAccessGate(input.accessGate ?? input.trialGrant ?? null)
}
