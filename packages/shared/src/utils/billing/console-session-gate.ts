/**
 * Console session gate (proxy): waitlist vs stay.
 *
 * Waitlist only when the user is not admin/tester and has no synced
 * Subscription row. Billing Path Established = ≥1 local Subscription for the
 * user's Stripe Customer (any status). Clock expiry never alone forces waitlist.
 */

/** Synced local Subscription row; only presence matters for this gate. */
export type ConsoleSessionSubscription = {
  status?: string
}

export type ConsoleSessionGateDecision = 'allow' | 'waitlist'

export type ConsoleSessionGateInput = {
  role?: string | null
  /** Synced local Subscription rows for this user's Stripe Customer. */
  subscriptions: readonly ConsoleSessionSubscription[]
}

/** Billing Path Established: any synced Subscription row (any status). */
export function hasBillingPathEstablished(
  subscriptions: readonly ConsoleSessionSubscription[],
): boolean {
  return subscriptions.length > 0
}

/**
 * Decide whether the console proxy should allow the session or redirect to
 * the website waitlist. Does not sign the user out; callers own that.
 */
export function decideConsoleSessionGate(
  input: ConsoleSessionGateInput,
): ConsoleSessionGateDecision {
  if (input.role === 'admin' || input.role === 'tester') return 'allow'
  if (hasBillingPathEstablished(input.subscriptions)) return 'allow'
  return 'waitlist'
}
