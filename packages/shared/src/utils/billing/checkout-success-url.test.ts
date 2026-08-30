import { describe, expect, it } from 'vitest'
import { getConsoleUrl } from '../../types/index.ts'
import {
  CHECKOUT_SUCCESS_INTENT_PARAM,
  CHECKOUT_SUCCESS_PATH,
  buildCheckoutCancelReturnUrl,
  buildCheckoutSuccessUrl,
  readCheckoutSuccessIntent,
  resolveLegacyCheckoutSuccessRedirect,
  stripCheckoutSuccessIntent,
} from './checkout-success-url.ts'
import { CHECKOUT_RETURN_PARAM } from './checkout-return-url.ts'

const consoleOrigin = getConsoleUrl()

describe('buildCheckoutSuccessUrl', () => {
  it('targets the Checkout Success Page with Subscribe vs Renew intent', () => {
    const subscribe = new URL(buildCheckoutSuccessUrl('subscribe'))
    const renew = new URL(buildCheckoutSuccessUrl('renew'))

    expect(subscribe.pathname).toBe(CHECKOUT_SUCCESS_PATH)
    expect(subscribe.searchParams.get(CHECKOUT_SUCCESS_INTENT_PARAM)).toBe(
      'subscribe',
    )
    expect(renew.searchParams.get(CHECKOUT_SUCCESS_INTENT_PARAM)).toBe('renew')
    expect(subscribe.origin).toBe(new URL(consoleOrigin).origin)
  })
})

describe('readCheckoutSuccessIntent', () => {
  it('reads subscribe and renew intent from the success page query', () => {
    expect(
      readCheckoutSuccessIntent(`?${CHECKOUT_SUCCESS_INTENT_PARAM}=subscribe`),
    ).toBe('subscribe')
    expect(
      readCheckoutSuccessIntent(`?${CHECKOUT_SUCCESS_INTENT_PARAM}=renew`),
    ).toBe('renew')
    expect(readCheckoutSuccessIntent('')).toBeNull()
  })
})

describe('stripCheckoutSuccessIntent', () => {
  it('removes Checkout Success Intent while keeping the path', () => {
    expect(
      stripCheckoutSuccessIntent(
        `${CHECKOUT_SUCCESS_PATH}?${CHECKOUT_SUCCESS_INTENT_PARAM}=renew`,
      ),
    ).toBe(CHECKOUT_SUCCESS_PATH)
  })
})

describe('resolveLegacyCheckoutSuccessRedirect', () => {
  it('redirects legacy checkoutReturn=success into the Checkout Success Page', () => {
    expect(
      resolveLegacyCheckoutSuccessRedirect('/user/u1/profile', {
        checkoutReturn: 'success',
        tab: 'billing',
      }),
    ).toBe(
      `${CHECKOUT_SUCCESS_PATH}?${CHECKOUT_SUCCESS_INTENT_PARAM}=subscribe`,
    )
  })

  it('preserves Checkout Success Intent when both legacy markers are present', () => {
    expect(
      resolveLegacyCheckoutSuccessRedirect('/patients', {
        checkoutReturn: 'success',
        checkoutSuccessIntent: 'renew',
      }),
    ).toBe(`${CHECKOUT_SUCCESS_PATH}?${CHECKOUT_SUCCESS_INTENT_PARAM}=renew`)
  })

  it('does not redirect from the Checkout Success Page itself', () => {
    expect(
      resolveLegacyCheckoutSuccessRedirect(CHECKOUT_SUCCESS_PATH, {
        checkoutReturn: 'success',
      }),
    ).toBeNull()
  })

  it('ignores non-success checkout returns', () => {
    expect(
      resolveLegacyCheckoutSuccessRedirect('/patients', {
        checkoutReturn: 'cancel',
      }),
    ).toBeNull()
  })
})

describe('buildCheckoutCancelReturnUrl', () => {
  it('marks cancel intent on the prior console return path', () => {
    const cancel = new URL(
      buildCheckoutCancelReturnUrl('/user/u1/profile?tab=billing'),
    )

    expect(cancel.searchParams.get(CHECKOUT_RETURN_PARAM)).toBe('cancel')
    expect(cancel.pathname).toBe('/user/u1/profile')
    expect(cancel.searchParams.get('tab')).toBe('billing')
  })
})
