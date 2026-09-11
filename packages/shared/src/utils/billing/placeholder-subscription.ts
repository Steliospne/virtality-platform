/**
 * Better Auth Stripe inserts a local Subscription row with status
 * `incomplete` before redirecting to Checkout, and reuses it on retry. An
 * abandoned Checkout leaves that row behind. It is a placeholder, not a
 * billing relationship: every read model that asks "does this clinician have
 * any Subscription" must ignore it, or the console shows a Pro seat that was
 * never paid for and skips the waitlist gate.
 */

const PLACEHOLDER_SUBSCRIPTION_STATUSES = new Set([
  'incomplete',
  'incomplete_expired',
])

/** Minimal subscription shape for placeholder checks. */
export type PlaceholderSubscriptionCandidate = {
  status?: string | null
}

/** True for the Checkout placeholder row Better Auth creates before payment. */
export function isPlaceholderSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  return status != null && PLACEHOLDER_SUBSCRIPTION_STATUSES.has(status)
}

/** Drops Checkout placeholder rows so only synced billing history remains. */
export function omitPlaceholderSubscriptions<
  T extends PlaceholderSubscriptionCandidate,
>(subscriptions: readonly T[]): T[] {
  return subscriptions.filter(
    (sub) => !isPlaceholderSubscriptionStatus(sub.status),
  )
}
