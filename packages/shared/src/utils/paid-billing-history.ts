/**
 * Canonical "Paid billing history" rule: has this clinician ever completed a
 * paid Pro billing period (not only trial-style entitlement that never
 * converted)? Used by Subscribe/Renew, Campaign Window attach, and Assign Free
 * after cancellation.
 */

import { isFreeSubscriptionPlan } from './billing-plans.ts'

/** Minimal subscription shape for paid-billing history checks. */
export type PaidBillingHistorySubscription = {
  status: string
  /** Synced Better Auth plan (`free` | `pro`); Free rows never count as paid. */
  plan?: string | null
  trialEnd?: Date | null
  periodEnd?: Date | null
}

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
  sub: PaidBillingHistorySubscription,
): boolean {
  if (isFreeSubscriptionPlan(sub.plan)) return false
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
  subscriptions: readonly PaidBillingHistorySubscription[],
): boolean {
  return subscriptions.some(subscriptionImpliesPaidBilling)
}
