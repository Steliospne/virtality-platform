/**
 * Canonical "Paid billing history" rule: has this clinician ever completed a
 * paid Default billing period? Used by Subscribe/Renew, Campaign Window attach,
 * and Assign Free after cancellation.
 */

import { isFreeSubscriptionPlan } from './billing-plans.ts'
import { isLiveEntitlementSubscriptionStatus } from './entitlement-extension.ts'

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

function subscriptionImpliesPaidBilling(
  sub: PaidBillingHistorySubscription,
): boolean {
  if (isFreeSubscriptionPlan(sub.plan)) return false
  if (PAID_BILLING_STATUSES.has(sub.status)) return true
  if (isLiveEntitlementSubscriptionStatus(sub.status)) return false
  return sub.periodEnd != null
}

/** True when any synced Subscription row implies Paid billing history. */
export function hadPaidBillingHistory(
  subscriptions: readonly PaidBillingHistorySubscription[],
): boolean {
  return subscriptions.some(subscriptionImpliesPaidBilling)
}
