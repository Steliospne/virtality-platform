/**
 * Console Profile Billing → shared Cycle plan restore (Better Auth
 * `subscription.restore`). Releases a scheduled period-end plan change or
 * undoes cancel-at-period-end.
 */

import {
  restoreSubscription as restoreSubscriptionShared,
  type CyclePlanChangePort,
} from '@virtality/shared/utils'

export type ProSubscriptionRestoreFn = CyclePlanChangePort['restore']

export type RestoreSubscriptionResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Restores a Stripe subscription via Better Auth (clear schedule and/or
 * cancel_at_period_end). Does not write local entitlement; standing refreshes
 * from synced fields.
 */
export async function restoreSubscription(input: {
  restore: ProSubscriptionRestoreFn
  referenceId?: string
}): Promise<RestoreSubscriptionResult> {
  const result = await restoreSubscriptionShared({
    port: { restore: input.restore },
    referenceId: input.referenceId,
  })

  if (!result.ok) {
    return { ok: false, message: result.message }
  }
  return { ok: true }
}
