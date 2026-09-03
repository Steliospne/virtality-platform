/**
 * Console Profile Billing → Better Auth Stripe Customer Portal.
 * Active seats manage payment method, invoices, and cancel/reactivate there.
 *
 * Better Auth Stripe resolves relative return URLs against the auth server
 * baseURL. Always pass absolute console URLs so portal exit lands on the
 * console, not :8080.
 *
 * Product posture (#72 / #78): Customer Portal must keep
 * "Use promotion codes" (promo-on-subscription-update) off so Portal cannot
 * bypass Console redeem / one-Discount precedence. Portal sessions are created
 * without enabling promotion codes; Dashboard configuration stays promo-off.
 */

import { toAbsoluteConsoleReturnUrl } from './subscription-checkout'

/**
 * Locked product posture: Portal subscription-update must not accept
 * Promotion Codes. Keep this false; do not pass promo-enablement flags when
 * opening billingPortal.
 */
export const CUSTOMER_PORTAL_PROMOTION_CODES_ON_SUBSCRIPTION_UPDATE = false

export type DefaultBillingPortalInput = {
  returnUrl: string
}

/**
 * Params for Better Auth `authClient.subscription.billingPortal`.
 * `returnUrl` is an absolute console URL. Never enables Portal promotion codes.
 */
export function buildDefaultBillingPortalInput(
  returnUrl: string,
): DefaultBillingPortalInput {
  return {
    returnUrl: toAbsoluteConsoleReturnUrl(returnUrl),
  }
}

export type DefaultSubscriptionBillingPortalFn = (
  input: DefaultBillingPortalInput,
) => Promise<{
  data?: unknown
  error?: { message?: string | null } | null
}>

export type StartDefaultBillingPortalResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Starts a Stripe Customer Portal session via Better Auth. Redirects on
 * success (unless the client opts out); does not write local entitlement.
 */
export async function startDefaultBillingPortal(input: {
  billingPortal: DefaultSubscriptionBillingPortalFn
  returnUrl: string
}): Promise<StartDefaultBillingPortalResult> {
  const { error } = await input.billingPortal(
    buildDefaultBillingPortalInput(input.returnUrl),
  )

  if (error) {
    return {
      ok: false,
      message: error.message?.trim() || 'Failed to open Customer Portal',
    }
  }

  return { ok: true }
}
