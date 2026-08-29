/**
 * Expired Free / canceled upgrade prompt: after a Trial Subscription converts
 * to Free, or after a paid seat reaches canceled, clinicians see a dismissible
 * upgrade dialog on each authenticated login and again every twelve hours
 * during a continuous Console session until paid entitlement is active.
 */

import {
  isFreeSubscriptionPlan,
  isProSubscriptionPlan,
} from './billing-plans.ts'
import {
  pickEntitlementSubscription,
  resolveEntitlementClock,
  type EntitlementClockSubscription,
} from './entitlement-clock.ts'
import { isLiveEntitlementSubscriptionStatus } from './entitlement-extension.ts'

export const EXPIRED_FREE_UPGRADE_PROMPT_INTERVAL_MS = 12 * 60 * 60 * 1000

export function isExpiredFreeSeat(
  subscription: EntitlementClockSubscription,
): boolean {
  return (
    isFreeSubscriptionPlan(subscription.plan) &&
    subscription.status === 'active'
  )
}

export function isCanceledUpgradeSeat(
  subscription: EntitlementClockSubscription,
): boolean {
  return subscription.status === 'canceled'
}

/** Pro cancel-at-period-end with paid access still remaining before period end. */
function hasPendingCancellationAccess(input: {
  now: Date
  subscriptions: readonly EntitlementClockSubscription[]
}): boolean {
  const nowMs = input.now.getTime()
  return input.subscriptions.some((subscription) => {
    if (
      !subscription.cancelAtPeriodEnd ||
      !isProSubscriptionPlan(subscription.plan)
    ) {
      return false
    }
    const periodEndMs = subscription.periodEnd?.getTime()
    return periodEndMs != null && periodEndMs > nowMs
  })
}

/**
 * Whether the seat should receive the upgrade prompt. Trialing, paid, and
 * cancel-at-period-end clinicians are excluded; expired Free and canceled
 * seats qualify once paid access has ended.
 */
export function resolveExpiredFreeUpgradeQualifies(input: {
  now: Date
  subscriptions: readonly EntitlementClockSubscription[]
}): boolean {
  if (hasPendingCancellationAccess(input)) return false

  const picked = pickEntitlementSubscription(input.subscriptions)
  const standing = resolveEntitlementClock({
    now: input.now,
    subscription: picked,
  })
  if (standing.entitled) return false

  const live = input.subscriptions.filter((sub) =>
    isLiveEntitlementSubscriptionStatus(sub.status),
  )
  if (
    live.some(
      (sub) => sub.status === 'trialing' || !isFreeSubscriptionPlan(sub.plan),
    )
  ) {
    return false
  }

  if (picked == null) return false
  return isExpiredFreeSeat(picked) || isCanceledUpgradeSeat(picked)
}

export function shouldShowExpiredFreeUpgradePrompt(input: {
  qualifies: boolean
  now: Date
  lastPromptAt: Date | null
  isNewAuthenticatedSession: boolean
}): boolean {
  if (!input.qualifies) return false
  if (input.isNewAuthenticatedSession) return true
  if (input.lastPromptAt == null) return true
  return (
    input.now.getTime() - input.lastPromptAt.getTime() >=
    EXPIRED_FREE_UPGRADE_PROMPT_INTERVAL_MS
  )
}
