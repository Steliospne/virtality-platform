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

/** Statuses that already imply an ongoing paid billing relationship. */
const PAID_BILLING_STATUSES = new Set([
  'active',
  'past_due',
  'unpaid',
  'paused',
])

/**
 * Canceled (and other non-live) seats count only when a paid period continued
 * past trial end (`periodEnd > trialEnd`). Missing trialEnd with a periodEnd
 * counts as paid; missing periodEnd does not.
 */
function paidPeriodContinuedPastTrial(
  sub: PaidBillingHistorySubscription,
): boolean {
  if (sub.periodEnd == null) return false
  if (sub.trialEnd == null) return true
  return sub.periodEnd.getTime() > sub.trialEnd.getTime()
}

function subscriptionImpliesPaidBilling(
  sub: PaidBillingHistorySubscription,
): boolean {
  if (isFreeSubscriptionPlan(sub.plan)) return false
  if (PAID_BILLING_STATUSES.has(sub.status)) return true
  return paidPeriodContinuedPastTrial(sub)
}

/** True when any synced Subscription row implies Paid billing history. */
export function hadPaidBillingHistory(
  subscriptions: readonly PaidBillingHistorySubscription[],
): boolean {
  return subscriptions.some(subscriptionImpliesPaidBilling)
}
