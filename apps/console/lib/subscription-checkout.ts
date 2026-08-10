/**
 * Console Subscribe/Renew → Better Auth Stripe Checkout (mode=subscription).
 * Visibility/labels come from the Entitlement Clock; this module only starts
 * Checkout on the canonical `pro` plan Price configured in auth.
 */

export const PRO_SUBSCRIPTION_PLAN = 'pro' as const

export type ProCheckoutUpgradeInput = {
  plan: typeof PRO_SUBSCRIPTION_PLAN
  successUrl: string
  cancelUrl: string
}

/**
 * Params for Better Auth `authClient.subscription.upgrade`. Subscribe and Renew
 * share this shape; only the CTA label differs upstream.
 */
export function buildProCheckoutUpgradeInput(urls: {
  successUrl: string
  cancelUrl: string
}): ProCheckoutUpgradeInput {
  return {
    plan: PRO_SUBSCRIPTION_PLAN,
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
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
 * Starts Better Auth Stripe Checkout for the canonical pro Price. Success and
 * cancel both return to `returnUrl` so abandon stays soft-expired in console
 * (entitlement restore is webhook-owned).
 */
export async function startProSubscriptionCheckout(input: {
  upgrade: ProSubscriptionUpgradeFn
  returnUrl: string
}): Promise<StartProSubscriptionCheckoutResult> {
  const { error } = await input.upgrade(
    buildProCheckoutUpgradeInput({
      successUrl: input.returnUrl,
      cancelUrl: input.returnUrl,
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
