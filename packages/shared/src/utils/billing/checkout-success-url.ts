/**
 * Console Checkout Success Page URL helpers. Clinician-facing celebration lives
 * at `/billing/success` with Checkout Success Intent (`subscribe` | `renew`).
 * Cancel returns to the prior console page with `checkoutReturn=cancel`.
 */

import { getConsoleUrl } from '../../types/index.ts'
import {
  CHECKOUT_RETURN_PARAM,
  toAbsoluteConsoleReturnUrl,
  withCheckoutReturnIntent,
} from './checkout-return-url.ts'

export const CHECKOUT_SUCCESS_PATH = '/billing/success' as const

/** Query param distinguishing Subscribe vs Renew copy on the success page. */
export const CHECKOUT_SUCCESS_INTENT_PARAM = 'checkoutSuccessIntent' as const

export type CheckoutSuccessIntent = 'subscribe' | 'renew'

const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/

function isAbsoluteUrl(url: string): boolean {
  return ABSOLUTE_URL_RE.test(url)
}

/**
 * Absolute console Checkout Success Page URL with Subscribe vs Renew intent.
 */
export function buildCheckoutSuccessUrl(intent: CheckoutSuccessIntent): string {
  const url = new URL(toAbsoluteConsoleReturnUrl(CHECKOUT_SUCCESS_PATH))
  url.searchParams.set(CHECKOUT_SUCCESS_INTENT_PARAM, intent)
  return url.href
}

export function readCheckoutSuccessIntent(
  search: string | URLSearchParams,
): CheckoutSuccessIntent | null {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search
  const value = params.get(CHECKOUT_SUCCESS_INTENT_PARAM)
  if (value === 'subscribe' || value === 'renew') return value
  return null
}

/**
 * Drop Checkout Success Intent; keep the rest of the URL.
 */
export function stripCheckoutSuccessIntent(pathWithSearch: string): string {
  if (isAbsoluteUrl(pathWithSearch)) {
    const url = new URL(pathWithSearch)
    url.searchParams.delete(CHECKOUT_SUCCESS_INTENT_PARAM)
    return url.href
  }
  const url = new URL(pathWithSearch, 'http://local.invalid')
  url.searchParams.delete(CHECKOUT_SUCCESS_INTENT_PARAM)
  return `${url.pathname}${url.search}${url.hash}`
}

/**
 * Legacy Checkout success returns may still land with `checkoutReturn=success`
 * on non-success pages. Redirect to the Checkout Success Page when intent is
 * known or default Subscribe when only the legacy marker is present.
 */
export function resolveLegacyCheckoutSuccessRedirect(
  pathname: string,
  search: string | URLSearchParams | Record<string, string>,
): string | null {
  const params =
    typeof search === 'string'
      ? new URLSearchParams(search)
      : search instanceof URLSearchParams
        ? search
        : new URLSearchParams(search)
  if (params.get(CHECKOUT_RETURN_PARAM) !== 'success') return null
  if (pathname === CHECKOUT_SUCCESS_PATH) return null

  const intent =
    readCheckoutSuccessIntent(params) ?? ('subscribe' as CheckoutSuccessIntent)
  const base = getConsoleUrl().replace(/\/$/, '')
  const url = new URL(`${base}${CHECKOUT_SUCCESS_PATH}`)
  url.searchParams.set(CHECKOUT_SUCCESS_INTENT_PARAM, intent)
  return url.pathname + url.search
}

/** Profile Billing cancel return for Checkout abandon. */
export function buildCheckoutCancelReturnUrl(returnUrl: string): string {
  return withCheckoutReturnIntent(returnUrl, 'cancel')
}
