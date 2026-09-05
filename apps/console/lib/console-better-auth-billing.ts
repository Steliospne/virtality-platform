/**
 * Console → Better Auth billing seam: immediate Checkout, restore, and
 * Customer Portal. Profile Billing and related hooks call this adapter only;
 * Checkout never schedules at period end. Cycle plan change uses orpc instead.
 */

import {
  restoreSubscription as restoreSubscriptionShared,
  type CyclePlanChangeRestorePort,
  type CheckoutSuccessIntent,
} from '@virtality/shared/utils'
import {
  startDefaultBillingPortal,
  type DefaultSubscriptionBillingPortalFn,
} from './subscription-billing-portal'
import {
  startDefaultSubscriptionCheckout,
  type DefaultCheckoutUpgradeInput,
} from './subscription-checkout'

export type ConsoleBetterAuthBillingUpgradeFn = (
  input: DefaultCheckoutUpgradeInput,
) => Promise<{
  data?: unknown
  error?: { message?: string | null } | null
}>

export type ConsoleBetterAuthBillingPort = Pick<
  CyclePlanChangeRestorePort,
  'restore'
> & {
  upgrade: ConsoleBetterAuthBillingUpgradeFn
  billingPortal: DefaultSubscriptionBillingPortalFn
}

export type ConsoleBetterAuthBillingResult =
  | { ok: true }
  | { ok: false; message: string }

export type ConsoleBetterAuthBilling = {
  startCheckout: (input: {
    returnUrl: string
    annual?: boolean
    checkoutSuccessIntent?: CheckoutSuccessIntent
  }) => Promise<ConsoleBetterAuthBillingResult>
  restore: (input?: {
    referenceId?: string
  }) => Promise<ConsoleBetterAuthBillingResult>
  openPortal: (input: {
    returnUrl: string
  }) => Promise<ConsoleBetterAuthBillingResult>
}

/** Clinician toast after a successful period-end Default interval schedule. */
export const CYCLE_PLAN_CHANGE_SCHEDULED_TOAST =
  'Plan change scheduled. It starts at your next billing cycle.'

/** Clinician toast after releasing a scheduled period-end plan change. */
export const CANCEL_SCHEDULE_RESTORE_TOAST =
  'Scheduled plan change canceled. You stay on your current plan.'

/** Clinician toast after undoing cancel-at-period-end. */
export const UNDO_CANCELLATION_RESTORE_TOAST =
  'Cancellation stopped. Your subscription will renew as usual.'

/**
 * Maps shared restore results onto the Console billing result shape (drops
 * subscription ids callers do not use).
 */
function toConsoleBillingResult(
  result: { ok: true } | { ok: false; message: string },
): ConsoleBetterAuthBillingResult {
  if (!result.ok) {
    return { ok: false, message: result.message }
  }
  return { ok: true }
}

/**
 * Applies Console billing auth toast side effects: errors always; optional
 * success copy (schedule / restore). Checkout and portal success redirect.
 */
export function notifyConsoleBillingAuthResult(
  result: ConsoleBetterAuthBillingResult,
  options: {
    successToast?: string
    toastError: (message: string) => void
    toastSuccess: (message: string) => void
  },
): ConsoleBetterAuthBillingResult {
  if (!result.ok) {
    options.toastError(result.message)
    return result
  }
  if (options.successToast) {
    options.toastSuccess(options.successToast)
  }
  return result
}

/**
 * Builds the Console Better Auth billing adapter over injected upgrade /
 * restore / billingPortal ports (browser auth client or mocks).
 */
export function createConsoleBetterAuthBilling(
  port: ConsoleBetterAuthBillingPort,
): ConsoleBetterAuthBilling {
  return {
    async startCheckout(input) {
      return startDefaultSubscriptionCheckout({
        upgrade: port.upgrade,
        returnUrl: input.returnUrl,
        annual: input.annual,
        checkoutSuccessIntent: input.checkoutSuccessIntent,
      })
    },

    async restore(input) {
      const result = await restoreSubscriptionShared({
        port,
        referenceId: input?.referenceId,
      })
      return toConsoleBillingResult(result)
    },

    async openPortal(input) {
      return startDefaultBillingPortal({
        billingPortal: port.billingPortal,
        returnUrl: input.returnUrl,
      })
    },
  }
}
