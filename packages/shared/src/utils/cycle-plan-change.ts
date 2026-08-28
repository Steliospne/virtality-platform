/**
 * Cycle plan change: paid Pro monthly ↔ yearly at period end via Better Auth
 * `subscription.upgrade({ scheduleAtPeriodEnd })`, released with
 * `subscription.restore`. Shared orchestration with an injected Better Auth
 * port so Console (browser client) and Adminboard (auth.api) share one path.
 */

import {
  toAbsoluteConsoleReturnUrl,
  withCheckoutReturnIntent,
} from './checkout-return-url.ts'
import {
  PRO_PLAN_ANNUAL_PRICE_ID,
  PRO_SUBSCRIPTION_PLAN,
  isProPlanPriceId,
} from './billing-plans.ts'

export type CyclePlanChangeUpgradeInput = {
  plan: typeof PRO_SUBSCRIPTION_PLAN
  annual: boolean
  referenceId?: string
  scheduleAtPeriodEnd: true
  disableRedirect: true
  successUrl: string
  cancelUrl: string
  returnUrl: string
}

export type CyclePlanChangeRestoreInput = {
  referenceId?: string
}

/**
 * Better Auth upgrade/restore boundary. Browser client and server `auth.api`
 * adapters both map into this shape (including optional schedule id after
 * server-side upgrade).
 */
export type CyclePlanChangePort = {
  upgrade: (input: CyclePlanChangeUpgradeInput) => Promise<{
    data?: unknown
    error?: { message?: string | null } | null
    stripeScheduleId?: string | null
  }>
  restore: (input: CyclePlanChangeRestoreInput) => Promise<{
    data?: unknown
    error?: { message?: string | null } | null
    stripeSubscriptionId?: string | null
  }>
}

export type CyclePlanChangeResult =
  | { ok: true; stripeScheduleId: string | null }
  | { ok: false; message: string }

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

/** True when the Price id is the canonical Pro yearly Price. */
export function isAnnualProPlanPriceId(priceId: string): boolean {
  return priceId === PRO_PLAN_ANNUAL_PRICE_ID
}

/**
 * Map a supported Pro Price id to Better Auth `annual` for Cycle plan change.
 * Throws when the id is not a supported Pro Price.
 */
export function annualFlagForProPlanPriceId(priceId: string): boolean {
  if (!isProPlanPriceId(priceId)) {
    throw new Error('priceId must be a supported Pro monthly or yearly Price.')
  }
  return isAnnualProPlanPriceId(priceId)
}

/** Pending Cycle plan change when Better Auth stored a Stripe schedule id. */
export function hasPendingCyclePlanChange(subscription: {
  stripeScheduleId?: string | null
}): boolean {
  return Boolean(subscription.stripeScheduleId)
}

/**
 * Builds Better Auth upgrade params for a period-end Pro interval switch.
 * Always sets `scheduleAtPeriodEnd` and `disableRedirect`.
 */
export function buildCyclePlanChangeUpgradeInput(input: {
  annual: boolean
  returnUrl: string
  referenceId?: string
}): CyclePlanChangeUpgradeInput {
  const absoluteReturn = toAbsoluteConsoleReturnUrl(input.returnUrl)
  return {
    plan: PRO_SUBSCRIPTION_PLAN,
    annual: input.annual,
    ...(input.referenceId ? { referenceId: input.referenceId } : {}),
    scheduleAtPeriodEnd: true,
    disableRedirect: true,
    returnUrl: absoluteReturn,
    successUrl: withCheckoutReturnIntent(input.returnUrl, 'success'),
    cancelUrl: withCheckoutReturnIntent(input.returnUrl, 'cancel'),
  }
}

/**
 * Schedules a paid Pro monthly ↔ yearly switch at period end through the
 * injected Better Auth port.
 */
export async function scheduleCyclePlanChange(input: {
  port: Pick<CyclePlanChangePort, 'upgrade'>
  referenceId?: string
  annual: boolean
  returnUrl: string
}): Promise<CyclePlanChangeResult> {
  const { error, stripeScheduleId } = await input.port.upgrade(
    buildCyclePlanChangeUpgradeInput({
      annual: input.annual,
      returnUrl: input.returnUrl,
      referenceId: input.referenceId,
    }),
  )

  if (error) {
    return {
      ok: false,
      message: portErrorMessage(error, 'Failed to schedule Cycle plan change'),
    }
  }

  return {
    ok: true,
    stripeScheduleId: stripeScheduleId ?? null,
  }
}

/**
 * Releases a pending Cycle plan change schedule and/or undoes
 * cancel-at-period-end via Better Auth restore.
 */
export async function restoreSubscription(input: {
  port: Pick<CyclePlanChangePort, 'restore'>
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
