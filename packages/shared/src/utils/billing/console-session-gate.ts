/**
 * Console session gate (proxy): waitlist vs stay.
 *
 * Waitlist only when the user is not admin/tester and has no established
 * billing path. Billing Path Established = an Access Gate has ever been
 * issued OR ≥1 synced Subscription row (any status except the Checkout
 * placeholder). Clock expiry never alone forces waitlist.
 */

import { omitPlaceholderSubscriptions } from './placeholder-subscription.ts'

/** Synced local Subscription row; only presence matters for this gate. */
export type ConsoleSessionSubscription = {
  status?: string
}

export type ConsoleSessionGateDecision = 'allow' | 'waitlist'

export type ConsoleSessionGateInput = {
  role?: string | null
  /** Synced local Subscription rows for this user's Stripe Customer. */
  subscriptions: readonly ConsoleSessionSubscription[]
  /** True when any Access Gate row exists for the user (any status). */
  accessGateEverIssued?: boolean
}

/** Billing Path Established: Access Gate ever issued or any synced Subscription. */
export function hasBillingPathEstablished(
  subscriptions: readonly ConsoleSessionSubscription[],
  options?: { accessGateEverIssued?: boolean },
): boolean {
  if (options?.accessGateEverIssued) return true
  return omitPlaceholderSubscriptions(subscriptions).length > 0
}

/**
 * Decide whether the console proxy should allow the session or redirect to
 * the website waitlist. Does not sign the user out; callers own that.
 */
export function decideConsoleSessionGate(
  input: ConsoleSessionGateInput,
): ConsoleSessionGateDecision {
  if (input.role === 'admin' || input.role === 'tester') return 'allow'
  if (
    hasBillingPathEstablished(input.subscriptions, {
      accessGateEverIssued: input.accessGateEverIssued,
    })
  ) {
    return 'allow'
  }
  return 'waitlist'
}
