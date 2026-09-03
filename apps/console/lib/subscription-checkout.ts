/**
 * Console Subscribe/Renew → Better Auth Stripe Checkout (mode=subscription).
 * Visibility/labels come from the Entitlement Clock; this module only starts
 * Checkout on the canonical `default` plan Price configured in auth.
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
  buildCheckoutCancelReturnUrl,
  buildCheckoutSuccessUrl,
  type CheckoutSuccessIntent,
  type CheckoutReturnIntent,
  toAbsoluteConsoleReturnUrl,
} from '@virtality/shared/utils'

export {
  CHECKOUT_RETURN_PARAM,
  CHECKOUT_SUCCESS_INTENT_PARAM,
  CHECKOUT_SUCCESS_PATH,
  buildCheckoutSuccessUrl,
  readCheckoutReturnIntent,
  readCheckoutSuccessIntent,
  stripCheckoutReturnIntent,
  toAbsoluteConsoleReturnUrl,
  withCheckoutReturnIntent,
  type CheckoutReturnIntent,
  type CheckoutSuccessIntent,
} from '@virtality/shared/utils'

export const DEFAULT_SUBSCRIPTION_PLAN = 'default' as const

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

export type DefaultCheckoutUpgradeInput = {
  plan: typeof DEFAULT_SUBSCRIPTION_PLAN
  /** When true, Better Auth uses the plan's annualDiscountPriceId (yearly). */
  annual: boolean
  /** Absolute console URL for Checkout return. */
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
 * Immediate Checkout only: paid Default monthly ↔ yearly period-end switches use
 * Cycle plan change (`scheduleCycleChange`), not this builder.
 * `annual` selects monthly vs yearly Price on the same `default` plan.
 * `successUrl` / `cancelUrl` / `returnUrl` are absolute console URLs.
 */
export function buildDefaultCheckoutUpgradeInput(
  returnUrl: string,
  options?: { annual?: boolean; checkoutSuccessIntent?: CheckoutSuccessIntent },
): DefaultCheckoutUpgradeInput {
  const absoluteReturn = toAbsoluteConsoleReturnUrl(returnUrl)
  const checkoutSuccessIntent = options?.checkoutSuccessIntent ?? 'subscribe'
  return {
    plan: DEFAULT_SUBSCRIPTION_PLAN,
    annual: options?.annual ?? false,
    returnUrl: absoluteReturn,
    successUrl: buildCheckoutSuccessUrl(checkoutSuccessIntent),
    cancelUrl: buildCheckoutCancelReturnUrl(returnUrl),
  }
}

export type DefaultSubscriptionUpgradeFn = (
  input: DefaultCheckoutUpgradeInput,
) => Promise<{
  data?: unknown
  error?: { message?: string | null } | null
}>

export type StartDefaultSubscriptionCheckoutResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Starts Better Auth Stripe Checkout / upgrade for the canonical default Price
 * (monthly or yearly). Immediate only: period-end Default interval switches go
 * through Cycle plan change. Does not write local entitlement; restore is
 * webhook/success sync only.
 */
export async function startDefaultSubscriptionCheckout(input: {
  upgrade: DefaultSubscriptionUpgradeFn
  returnUrl: string
  annual?: boolean
  checkoutSuccessIntent?: CheckoutSuccessIntent
}): Promise<StartDefaultSubscriptionCheckoutResult> {
  const { error } = await input.upgrade(
    buildDefaultCheckoutUpgradeInput(input.returnUrl, {
      annual: input.annual,
      checkoutSuccessIntent: input.checkoutSuccessIntent,
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
