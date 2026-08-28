/**
 * Console → Better Auth billing seam: immediate Checkout, Cycle plan schedule,
 * restore, and Customer Portal. Profile Billing and related hooks call this
 * adapter only; Checkout never schedules at period end.
 */

import {
  restoreSubscription as restoreSubscriptionShared,
  scheduleCyclePlanChange as scheduleCyclePlanChangeShared,
  type CyclePlanChangePort,
  type CyclePlanChangeUpgradeInput,
} from '@virtality/shared/utils'
import {
  startProBillingPortal,
  type ProSubscriptionBillingPortalFn,
} from './subscription-billing-portal'
import {
  startProSubscriptionCheckout,
  type ProCheckoutUpgradeInput,
} from './subscription-checkout'

export type ConsoleBetterAuthBillingUpgradeFn = (
  input: ProCheckoutUpgradeInput | CyclePlanChangeUpgradeInput,
) => Promise<{
  data?: unknown
  error?: { message?: string | null } | null
  stripeScheduleId?: string | null
}>

export type ConsoleBetterAuthBillingPort = {
  upgrade: ConsoleBetterAuthBillingUpgradeFn
  restore: CyclePlanChangePort['restore']
  billingPortal: ProSubscriptionBillingPortalFn
}

export type ConsoleBetterAuthBillingResult =
  | { ok: true }
  | { ok: false; message: string }

export type ConsoleBetterAuthBilling = {
  startCheckout: (input: {
    returnUrl: string
    annual?: boolean
  }) => Promise<ConsoleBetterAuthBillingResult>
  scheduleCycleChange: (input: {
    returnUrl: string
    annual: boolean
    referenceId?: string
  }) => Promise<ConsoleBetterAuthBillingResult>
  restore: (input?: {
    referenceId?: string
  }) => Promise<ConsoleBetterAuthBillingResult>
  openPortal: (input: {
    returnUrl: string
  }) => Promise<ConsoleBetterAuthBillingResult>
}

/** Clinician toast after a successful period-end Pro interval schedule. */
export const CYCLE_PLAN_CHANGE_SCHEDULED_TOAST =
  'Plan change scheduled. It starts at your next billing cycle.'

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
      return startProSubscriptionCheckout({
        upgrade: port.upgrade,
        returnUrl: input.returnUrl,
        annual: input.annual,
      })
    },

    async scheduleCycleChange(input) {
      const result = await scheduleCyclePlanChangeShared({
        port: { upgrade: port.upgrade },
        annual: input.annual,
        returnUrl: input.returnUrl,
        referenceId: input.referenceId,
      })
      if (!result.ok) {
        return { ok: false, message: result.message }
      }
      return { ok: true }
    },

    async restore(input) {
      const result = await restoreSubscriptionShared({
        port: { restore: port.restore },
        referenceId: input?.referenceId,
      })
      if (!result.ok) {
        return { ok: false, message: result.message }
      }
      return { ok: true }
    },

    async openPortal(input) {
      return startProBillingPortal({
        billingPortal: port.billingPortal,
        returnUrl: input.returnUrl,
      })
    },
  }
}
