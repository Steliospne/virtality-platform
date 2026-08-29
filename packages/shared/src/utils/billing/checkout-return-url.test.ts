import { describe, expect, it } from 'vitest'
import { getConsoleUrl } from '../../types/index.ts'
import {
  CHECKOUT_RETURN_PARAM,
  readCheckoutReturnIntent,
  stripCheckoutReturnIntent,
  toAbsoluteConsoleReturnUrl,
  withCheckoutReturnIntent,
} from './checkout-return-url.ts'

const consoleOrigin = getConsoleUrl().replace(/\/$/, '')

describe('toAbsoluteConsoleReturnUrl', () => {
  it('keeps absolute URLs and resolves relative paths against the console origin', () => {
    expect(
      toAbsoluteConsoleReturnUrl(`${consoleOrigin}/user/abc/profile`),
    ).toBe(`${consoleOrigin}/user/abc/profile`)
    expect(toAbsoluteConsoleReturnUrl('/user/abc/profile')).toBe(
      `${consoleOrigin}/user/abc/profile`,
    )
    expect(toAbsoluteConsoleReturnUrl('user/abc/profile')).toBe(
      `${consoleOrigin}/user/abc/profile`,
    )
  })
})

describe('withCheckoutReturnIntent', () => {
  it('marks success and cancel on absolute console URLs', () => {
    const returnUrl = '/user/abc/profile?tab=billing'
    const success = withCheckoutReturnIntent(returnUrl, 'success')
    const cancel = withCheckoutReturnIntent(returnUrl, 'cancel')

    expect(new URL(success).searchParams.get(CHECKOUT_RETURN_PARAM)).toBe(
      'success',
    )
    expect(new URL(cancel).searchParams.get(CHECKOUT_RETURN_PARAM)).toBe(
      'cancel',
    )
    expect(success).toBe(
      `${consoleOrigin}/user/abc/profile?tab=billing&${CHECKOUT_RETURN_PARAM}=success`,
    )
    expect(cancel).toBe(
      `${consoleOrigin}/user/abc/profile?tab=billing&${CHECKOUT_RETURN_PARAM}=cancel`,
    )
  })
})

describe('readCheckoutReturnIntent', () => {
  it('reads success, cancel, or null', () => {
    expect(readCheckoutReturnIntent('?checkoutReturn=success')).toBe('success')
    expect(readCheckoutReturnIntent('?checkoutReturn=cancel')).toBe('cancel')
    expect(readCheckoutReturnIntent('')).toBeNull()
    expect(readCheckoutReturnIntent('?other=1')).toBeNull()
  })
})

describe('stripCheckoutReturnIntent', () => {
  it('removes the marker from relative and absolute URLs', () => {
    expect(stripCheckoutReturnIntent('/app?checkoutReturn=success&tab=1')).toBe(
      '/app?tab=1',
    )
    expect(stripCheckoutReturnIntent('/app?checkoutReturn=cancel')).toBe('/app')
    expect(
      stripCheckoutReturnIntent(
        `${consoleOrigin}/app?checkoutReturn=success&tab=1`,
      ),
    ).toBe(`${consoleOrigin}/app?tab=1`)
  })
})
