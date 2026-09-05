/**
 * Cycle plan change: paid Default monthly ↔ yearly at period end, released with
 * Better Auth `subscription.restore`. Scheduling uses Assigned Variant prices
 * (see auth `scheduleAssignedVariantCyclePlanChange`); restore goes through an
 * injected Better Auth port for Console (browser client) and Adminboard (auth.api).
 */

import {
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  isDefaultPlanPriceId,
} from './billing-plans.ts'

export type CyclePlanChangeRestoreInput = {
  referenceId?: string
}

/**
 * Better Auth restore boundary. Browser client and server `auth.api` adapters
 * both map into this shape.
 */
export type CyclePlanChangeRestorePort = {
  restore: (input: CyclePlanChangeRestoreInput) => Promise<{
    data?: unknown
    error?: { message?: string | null } | null
    stripeSubscriptionId?: string | null
  }>
}

export type CyclePlanChangeScheduleInput = {
  referenceId: string
  annual: boolean
}

export type CyclePlanChangeResult =
  | { ok: true; stripeScheduleId: string | null }
  | { ok: false; message: string }

/** Restore via Better Auth plus Stripe schedule for admin/customer interval switches. */
export type CyclePlanChangePort = CyclePlanChangeRestorePort & {
  scheduleCyclePlanChange: (
    input: CyclePlanChangeScheduleInput,
  ) => Promise<CyclePlanChangeResult>
}

export type CyclePlanRestoreResult =
  | { ok: true; stripeSubscriptionId: string | null }
  | { ok: false; message: string }

/** Better Auth `authorizeReference` actions relevant to Cycle plan change. */
export type CyclePlanAuthorizeReferenceAction =
  | 'upgrade-subscription'
  | 'list-subscription'
  | 'cancel-subscription'
  | 'restore-subscription'
  | 'billing-portal'

/**
 * Admins may schedule / restore Cycle plan changes for a customer
 * `referenceId`. Self-serve (referenceId === session user) never reaches this
 * callback. Other actions stay forbidden for cross-user ids.
 */
export function authorizeAdminCyclePlanReference(input: {
  role: string | null | undefined
  action: CyclePlanAuthorizeReferenceAction
}): boolean {
  if (input.role !== 'admin') return false
  return (
    input.action === 'upgrade-subscription' ||
    input.action === 'restore-subscription'
  )
}

function portErrorMessage(
  error: { message?: string | null } | null | undefined,
  fallback: string,
): string {
  return error?.message?.trim() || fallback
}

/** True when the Price id is the canonical Default yearly Price. */
export function isAnnualDefaultPlanPriceId(priceId: string): boolean {
  return priceId === DEFAULT_PLAN_ANNUAL_PRICE_ID
}

/**
 * Map a supported Default Price id to the yearly interval flag for Cycle plan
 * change. Throws when the id is not a supported Default Price.
 */
export function annualFlagForDefaultPlanPriceId(priceId: string): boolean {
  if (!isDefaultPlanPriceId(priceId)) {
    throw new Error(
      'priceId must be a supported Default monthly or yearly Price.',
    )
  }
  return isAnnualDefaultPlanPriceId(priceId)
}

/** Pending Cycle plan change when Better Auth stored a Stripe schedule id. */
export function hasPendingCyclePlanChange(subscription: {
  stripeScheduleId?: string | null
}): boolean {
  return Boolean(subscription.stripeScheduleId)
}

/**
 * Releases a pending Cycle plan change schedule and/or undoes
 * cancel-at-period-end via Better Auth restore.
 */
export async function restoreSubscription(input: {
  port: CyclePlanChangeRestorePort
  referenceId?: string
}): Promise<CyclePlanRestoreResult> {
  const { error, stripeSubscriptionId } = await input.port.restore(
    input.referenceId ? { referenceId: input.referenceId } : {},
  )

  if (error) {
    return {
      ok: false,
      message: portErrorMessage(error, 'Failed to restore the subscription'),
    }
  }

  return {
    ok: true,
    stripeSubscriptionId: stripeSubscriptionId ?? null,
  }
}
