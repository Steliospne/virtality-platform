/**
 * Expired Free / canceled upgrade prompt: after a Trial Subscription converts
 * to Free, or after a paid seat reaches canceled, clinicians see a dismissible
 * upgrade dialog on each authenticated login and again every twelve hours
 * during a continuous Console session until paid entitlement is active.
 */

import { isFreeSubscriptionPlan } from './billing-plans.ts'
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

/**
 * Whether the seat should receive the upgrade prompt. Trialing and paid
 * clinicians are excluded; expired Free and canceled seats qualify.
 */
export function resolveExpiredFreeUpgradeQualifies(input: {
  now: Date
  subscriptions: readonly EntitlementClockSubscription[]
}): boolean {
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
