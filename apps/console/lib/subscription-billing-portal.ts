/**
 * Console Profile Billing → Better Auth Stripe Customer Portal.
 * Active seats manage payment method, invoices, and cancel/reactivate there.
 *
 * Better Auth Stripe resolves relative return URLs against the auth server
 * baseURL. Always pass absolute console URLs so portal exit lands on the
 * console, not :8080.
 */

import { toAbsoluteConsoleReturnUrl } from './subscription-checkout'

export type ProBillingPortalInput = {
  returnUrl: string
}

/**
 * Params for Better Auth `authClient.subscription.billingPortal`.
 * `returnUrl` is an absolute console URL.
 */
export function buildProBillingPortalInput(
  returnUrl: string,
): ProBillingPortalInput {
  return {
    returnUrl: toAbsoluteConsoleReturnUrl(returnUrl),
  }
}

export type ProSubscriptionBillingPortalFn = (
  input: ProBillingPortalInput,
) => Promise<{
  data?: unknown
  error?: { message?: string | null } | null
}>

export type StartProBillingPortalResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Starts a Stripe Customer Portal session via Better Auth. Redirects on
 * success (unless the client opts out); does not write local entitlement.
 */
export async function startProBillingPortal(input: {
  billingPortal: ProSubscriptionBillingPortalFn
  returnUrl: string
}): Promise<StartProBillingPortalResult> {
  const { error } = await input.billingPortal(
    buildProBillingPortalInput(input.returnUrl),
  )

  if (error) {
    return {
      ok: false,
      message: error.message?.trim() || 'Failed to open Customer Portal',
    }
  }

  return { ok: true }
}
