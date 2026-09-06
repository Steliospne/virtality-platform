/**
 * Expired Free / canceled upgrade prompt: clinicians who are not entitled but
 * have an established billing path see a dismissible upgrade dialog on each
 * authenticated login and again every twelve hours during a continuous Console
 * session until paid entitlement is active.
 *
 * Entitlement is taken as given (the merged `entitled` from
 * `resolveEntitlementFromSources` / `buildEntitlementStanding`), never
 * recomputed here from raw Subscription rows.
 */

import { isDefaultSubscriptionPlan } from './billing-plans.ts'
import type { EntitlementClockSubscription } from './entitlement-clock.ts'

export const EXPIRED_FREE_UPGRADE_PROMPT_INTERVAL_MS = 12 * 60 * 60 * 1000

/** Default cancel-at-period-end with paid access still remaining before period end. */
function hasPendingCancellationAccess(input: {
  now: Date
  subscriptions: readonly EntitlementClockSubscription[]
}): boolean {
  const nowMs = input.now.getTime()
  return input.subscriptions.some((subscription) => {
    if (
      !subscription.cancelAtPeriodEnd ||
      !isDefaultSubscriptionPlan(subscription.plan)
    ) {
      return false
    }
    const periodEndMs = subscription.periodEnd?.getTime()
    return periodEndMs != null && periodEndMs > nowMs
  })
}

/**
 * Whether the seat should receive the upgrade prompt. Any live entitlement
 * and cancel-at-period-end clinicians are excluded. Non-entitled Access Gate
 * statuses (`granted`, `converted`, `revoked`, lapsed `trialing`), canceled
 * paid seats, and other established-path soft-expired seats qualify once paid
 * access has ended.
 */
export function resolveExpiredFreeUpgradeQualifies(input: {
  now: Date
  entitled: boolean
  billingPathEstablished: boolean
  subscriptions: readonly EntitlementClockSubscription[]
}): boolean {
  if (input.entitled) return false
  if (!input.billingPathEstablished) return false
  if (hasPendingCancellationAccess(input)) return false

  return true
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
