/**
 * Console Checkout / Cycle plan change return URLs. Better Auth Stripe resolves
 * relative success/cancel URLs against the auth server baseURL, so callers must
 * pass absolute console URLs.
 */

import { getConsoleUrl } from '../types/index.ts'

/** Query param marking Checkout return intent on the console URL. */
export const CHECKOUT_RETURN_PARAM = 'checkoutReturn' as const

export type CheckoutReturnIntent = 'success' | 'cancel'

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

/**
 * Attach success/cancel intent to the console return path so abandon and
 * payment completion stay distinguishable. Always returns an absolute console
 * URL (Better Auth must not resolve these against the auth host).
 */
export function withCheckoutReturnIntent(
  returnUrl: string,
  intent: CheckoutReturnIntent,
): string {
  const url = new URL(toAbsoluteConsoleReturnUrl(returnUrl))
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
