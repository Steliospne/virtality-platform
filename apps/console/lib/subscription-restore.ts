/**
 * Console Profile Billing → Better Auth `subscription.restore`.
 * Releases a scheduled period-end plan change (`stripeScheduleId`) or undoes
 * cancel-at-period-end so the seat renews as usual.
 */

export type ProSubscriptionRestoreFn = (input?: {
  subscriptionId?: string
  referenceId?: string
}) => Promise<{
  data?: unknown
  error?: { message?: string | null } | null
}>

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
}): Promise<RestoreSubscriptionResult> {
  const { error } = await input.restore({})

  if (error) {
    return {
      ok: false,
      message: error.message?.trim() || 'Failed to restore the subscription',
    }
  }

  return { ok: true }
}
