/**
 * Console Subscribe/Renew → Better Auth Stripe Checkout (mode=subscription).
 * Visibility/labels come from the Entitlement Clock; this module only starts
 * Checkout on the canonical `pro` plan Price configured in auth.
 *
 * Return URLs mark success vs cancel so the console can await webhook/success
 * sync without dual-writing entitlement. Abandon stays soft-expired; restore
 * only happens when synced Subscriptions yield a live clock.
 *
 * Better Auth Stripe resolves relative success/cancel URLs against the auth
 * server baseURL. Always pass absolute console URLs so Stripe cancel and the
 * /subscription/success callback redirect land on the console, not :8080.
 */

import {
  toAbsoluteConsoleReturnUrl,
  withCheckoutReturnIntent,
  type CheckoutReturnIntent,
} from '@virtality/shared/utils'

export {
  CHECKOUT_RETURN_PARAM,
  readCheckoutReturnIntent,
  stripCheckoutReturnIntent,
  toAbsoluteConsoleReturnUrl,
  withCheckoutReturnIntent,
  type CheckoutReturnIntent,
} from '@virtality/shared/utils'

export const PRO_SUBSCRIPTION_PLAN = 'pro' as const

export const CHECKOUT_ENTITLEMENT_RESTORE_POLL_MS = 2_000
export const CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS = 60_000

/**
 * Whether to keep polling Entitlement Clock after Checkout success while still
 * soft-expired. Cancel/abandon never polls (CTA stays). Stops once entitled or
 * after the max wait so we never invent entitlement client-side.
 */
export function shouldPollCheckoutEntitlementRestore(input: {
  intent: CheckoutReturnIntent | null
  entitled: boolean
  startedAtMs: number
  nowMs: number
}): boolean {
  if (input.intent !== 'success' || input.entitled) return false
  return input.nowMs - input.startedAtMs < CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS
}

export type ProCheckoutUpgradeInput = {
  plan: typeof PRO_SUBSCRIPTION_PLAN
  /** When true, Better Auth uses the plan's annualDiscountPriceId (yearly). */
  annual: boolean
  /**
   * When true, Better Auth schedules the price change at period end (paid Pro
   * monthly ↔ yearly). Free → Paid stays false so the charge is immediate.
   */
  scheduleAtPeriodEnd: boolean
  /**
   * When true, Better Auth skips client redirect. Used for period-end
   * interval switches so Profile Billing can refetch standing and show Cancel.
   */
  disableRedirect: boolean
  /** Absolute console URL for Portal / scheduled-change return. */
  returnUrl: string
  successUrl: string
  cancelUrl: string
}

/**
 * Params for Better Auth `authClient.subscription.upgrade`. Subscribe and Renew
 * share this shape; only the CTA label differs upstream. Success and cancel
 * return to the same console path with distinct intent markers so abandon stays
 * soft-expired and success can await webhook sync (no optimistic entitlement).
 *
 * `annual` selects monthly vs yearly Price on the same `pro` plan.
 * `scheduleAtPeriodEnd` defers paid Pro interval switches to the next cycle and
 * disables redirect so the tab can refresh standing (Update → Cancel).
 * `successUrl` / `cancelUrl` / `returnUrl` are absolute console URLs.
 */
export function buildProCheckoutUpgradeInput(
  returnUrl: string,
  options?: { annual?: boolean; scheduleAtPeriodEnd?: boolean },
): ProCheckoutUpgradeInput {
  const absoluteReturn = toAbsoluteConsoleReturnUrl(returnUrl)
  const scheduleAtPeriodEnd = options?.scheduleAtPeriodEnd ?? false
  return {
    plan: PRO_SUBSCRIPTION_PLAN,
    annual: options?.annual ?? false,
    scheduleAtPeriodEnd,
    disableRedirect: scheduleAtPeriodEnd,
    returnUrl: absoluteReturn,
    successUrl: withCheckoutReturnIntent(returnUrl, 'success'),
    cancelUrl: withCheckoutReturnIntent(returnUrl, 'cancel'),
  }
}

export type ProSubscriptionUpgradeFn = (
  input: ProCheckoutUpgradeInput,
) => Promise<{
  data?: unknown
  error?: { message?: string | null } | null
}>

export type StartProSubscriptionCheckoutResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Starts Better Auth Stripe Checkout / upgrade for the canonical pro Price
 * (monthly or yearly). Does not write local entitlement; restore is
 * webhook/success sync only. Paid Pro interval switches pass
 * `scheduleAtPeriodEnd` so the new price starts next cycle.
 */
export async function startProSubscriptionCheckout(input: {
  upgrade: ProSubscriptionUpgradeFn
  returnUrl: string
  annual?: boolean
  scheduleAtPeriodEnd?: boolean
}): Promise<StartProSubscriptionCheckoutResult> {
  const { error } = await input.upgrade(
    buildProCheckoutUpgradeInput(input.returnUrl, {
      annual: input.annual,
      scheduleAtPeriodEnd: input.scheduleAtPeriodEnd,
    }),
  )

  if (error) {
    return {
      ok: false,
      message: error.message?.trim() || 'Failed to start Checkout',
    }
  }

  return { ok: true }
}
