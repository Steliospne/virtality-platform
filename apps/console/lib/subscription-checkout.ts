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

import { getConsoleUrl } from '@virtality/shared/types'

export const PRO_SUBSCRIPTION_PLAN = 'pro' as const

/** Query param marking Checkout return intent on the console URL. */
export const CHECKOUT_RETURN_PARAM = 'checkoutReturn' as const

export type CheckoutReturnIntent = 'success' | 'cancel'

export const CHECKOUT_ENTITLEMENT_RESTORE_POLL_MS = 2_000
export const CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS = 60_000

const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/

function isAbsoluteUrl(url: string): boolean {
  return ABSOLUTE_URL_RE.test(url)
}

/**
 * Absolute console return URL for Better Auth / Stripe. Relative paths are
 * resolved against getConsoleUrl(); already-absolute URLs are kept.
 */
export function toAbsoluteConsoleReturnUrl(returnUrl: string): string {
  if (isAbsoluteUrl(returnUrl)) return returnUrl
  const base = getConsoleUrl().replace(/\/$/, '')
  const path = returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`
  return `${base}${path}`
}

function toUrl(returnUrl: string): URL {
  return new URL(toAbsoluteConsoleReturnUrl(returnUrl))
}

/**
 * Attach success/cancel intent to the console return path so abandon and
 * payment completion stay distinguishable. Always returns an absolute console
 * URL (Better Auth must not resolve these against the auth host).
 */
export function withCheckoutReturnIntent(
  returnUrl: string,
  intent: CheckoutReturnIntent,
): string {
  const url = toUrl(returnUrl)
  url.searchParams.set(CHECKOUT_RETURN_PARAM, intent)
  return url.href
}

export function readCheckoutReturnIntent(
  search: string | URLSearchParams,
): CheckoutReturnIntent | null {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search
  const value = params.get(CHECKOUT_RETURN_PARAM)
  if (value === 'success' || value === 'cancel') return value
  return null
}

/**
 * Drop the Checkout return marker; keep the rest of the URL.
 * Absolute inputs stay absolute; relative inputs stay path+search+hash.
 */
export function stripCheckoutReturnIntent(pathWithSearch: string): string {
  if (isAbsoluteUrl(pathWithSearch)) {
    const url = new URL(pathWithSearch)
    url.searchParams.delete(CHECKOUT_RETURN_PARAM)
    return url.href
  }
  const url = new URL(pathWithSearch, 'http://local.invalid')
  url.searchParams.delete(CHECKOUT_RETURN_PARAM)
  return `${url.pathname}${url.search}${url.hash}`
}

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
 * `successUrl` / `cancelUrl` are absolute console URLs.
 */
export function buildProCheckoutUpgradeInput(
  returnUrl: string,
  options?: { annual?: boolean },
): ProCheckoutUpgradeInput {
  return {
    plan: PRO_SUBSCRIPTION_PLAN,
    annual: options?.annual ?? false,
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
 * Starts Better Auth Stripe Checkout for the canonical pro Price (monthly or
 * yearly). Does not write local entitlement; restore is webhook/success sync only.
 */
export async function startProSubscriptionCheckout(input: {
  upgrade: ProSubscriptionUpgradeFn
  returnUrl: string
  annual?: boolean
}): Promise<StartProSubscriptionCheckoutResult> {
  const { error } = await input.upgrade(
    buildProCheckoutUpgradeInput(input.returnUrl, { annual: input.annual }),
  )

  if (error) {
    return {
      ok: false,
      message: error.message?.trim() || 'Failed to start Checkout',
    }
  }

  return { ok: true }
}
