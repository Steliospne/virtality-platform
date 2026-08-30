import { describe, expect, it } from 'vitest'
import { getConsoleUrl } from '@virtality/shared/types'
import {
  CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS,
  CHECKOUT_RETURN_PARAM,
  CHECKOUT_SUCCESS_INTENT_PARAM,
  CHECKOUT_SUCCESS_PATH,
  PRO_SUBSCRIPTION_PLAN,
  buildProCheckoutUpgradeInput,
  readCheckoutReturnIntent,
  shouldPollCheckoutEntitlementRestore,
  startProSubscriptionCheckout,
} from './subscription-checkout.js'

const consoleOrigin = getConsoleUrl()

describe('buildProCheckoutUpgradeInput', () => {
  it('lands successful Checkout on the Checkout Success Page with intent', () => {
    const input = buildProCheckoutUpgradeInput('/app', {
      checkoutSuccessIntent: 'renew',
    })
    const success = new URL(input.successUrl)
    const cancel = new URL(input.cancelUrl)

    expect(input.plan).toBe(PRO_SUBSCRIPTION_PLAN)
    expect(success.pathname).toBe(CHECKOUT_SUCCESS_PATH)
    expect(success.searchParams.get(CHECKOUT_SUCCESS_INTENT_PARAM)).toBe(
      'renew',
    )
    expect(readCheckoutReturnIntent(cancel.search)).toBe('cancel')
    expect(success.origin).toBe(new URL(consoleOrigin).origin)
    expect(cancel.pathname).toBe('/app')
  })

  it('defaults Checkout Success Intent to subscribe', () => {
    const success = new URL(buildProCheckoutUpgradeInput('/app').successUrl)

    expect(success.searchParams.get(CHECKOUT_SUCCESS_INTENT_PARAM)).toBe(
      'subscribe',
    )
  })

  it('preserves existing query params on the cancel return URL', () => {
    const input = buildProCheckoutUpgradeInput('/patients?tab=devices')
    const cancel = new URL(input.cancelUrl)

    expect(cancel.origin).toBe(new URL(consoleOrigin).origin)
    expect(cancel.pathname).toBe('/patients')
    expect(cancel.searchParams.get('tab')).toBe('devices')
    expect(cancel.searchParams.get(CHECKOUT_RETURN_PARAM)).toBe('cancel')
  })

  it('keeps absolute console cancel URLs absolute (not auth-host relative)', () => {
    const input = buildProCheckoutUpgradeInput(
      `${consoleOrigin}/user/abc/profile?tab=billing`,
      { checkoutSuccessIntent: 'subscribe' },
    )

    expect(input.cancelUrl).toBe(
      `${consoleOrigin}/user/abc/profile?tab=billing&${CHECKOUT_RETURN_PARAM}=cancel`,
    )
    expect(new URL(input.successUrl).pathname).toBe(CHECKOUT_SUCCESS_PATH)
  })

  it('does not request a trial period on the paid Checkout path', () => {
    const input = buildProCheckoutUpgradeInput('/')

    expect(input).not.toHaveProperty('trialDays')
    expect(input).not.toHaveProperty('freeTrial')
  })

  it('defaults to monthly Checkout (annual: false)', () => {
    const input = buildProCheckoutUpgradeInput('/app')

    expect(input.annual).toBe(false)
  })

  it('requests yearly Checkout when annual is true', () => {
    const input = buildProCheckoutUpgradeInput('/app', { annual: true })

    expect(input.plan).toBe(PRO_SUBSCRIPTION_PLAN)
    expect(input.annual).toBe(true)
  })

  it('is immediate Checkout only (no scheduleAtPeriodEnd or disableRedirect)', () => {
    const input = buildProCheckoutUpgradeInput('/app', { annual: true })

    expect(input).not.toHaveProperty('scheduleAtPeriodEnd')
    expect(input).not.toHaveProperty('disableRedirect')
    expect(input.returnUrl).toBe(`${consoleOrigin}/app`)
    expect(input.annual).toBe(true)
  })
})

describe('checkout return intent', () => {
  it('polls for entitlement restore only after success return while still soft-expired', () => {
    expect(
      shouldPollCheckoutEntitlementRestore({
        intent: 'success',
        entitled: false,
        startedAtMs: 0,
        nowMs: 1_000,
      }),
    ).toBe(true)

    expect(
      shouldPollCheckoutEntitlementRestore({
        intent: 'cancel',
        entitled: false,
        startedAtMs: 0,
        nowMs: 1_000,
      }),
    ).toBe(false)

    expect(
      shouldPollCheckoutEntitlementRestore({
        intent: 'success',
        entitled: true,
        startedAtMs: 0,
        nowMs: 1_000,
      }),
    ).toBe(false)

    expect(
      shouldPollCheckoutEntitlementRestore({
        intent: 'success',
        entitled: false,
        startedAtMs: 0,
        nowMs: CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS,
      }),
    ).toBe(false)
  })
})

describe('startProSubscriptionCheckout', () => {
  it('starts Better Auth upgrade for the canonical pro plan at returnUrl', async () => {
    const calls: unknown[] = []
    const upgrade = async (input: unknown) => {
      calls.push(input)
      return { data: { url: 'https://checkout.stripe.test/cs_test' } }
    }

    const result = await startProSubscriptionCheckout({
      upgrade,
      returnUrl: '/patients',
      checkoutSuccessIntent: 'renew',
    })

    expect(result).toEqual({ ok: true })
    expect(calls).toEqual([
      buildProCheckoutUpgradeInput('/patients', {
        checkoutSuccessIntent: 'renew',
      }),
    ])
  })

  it('passes annual through to Better Auth upgrade', async () => {
    const calls: unknown[] = []
    const upgrade = async (input: unknown) => {
      calls.push(input)
      return { data: { url: 'https://checkout.stripe.test/cs_test' } }
    }

    const result = await startProSubscriptionCheckout({
      upgrade,
      returnUrl: '/profile',
      annual: true,
    })

    expect(result).toEqual({ ok: true })
    expect(calls).toEqual([
      buildProCheckoutUpgradeInput('/profile', { annual: true }),
    ])
  })

  it('surfaces Better Auth upgrade failures without claiming success', async () => {
    const result = await startProSubscriptionCheckout({
      upgrade: async () => ({
        error: { message: 'Already subscribed to this plan' },
      }),
      returnUrl: '/',
    })

    expect(result).toEqual({
      ok: false,
      message: 'Already subscribed to this plan',
    })
  })

  it('falls back when Better Auth omits an error message', async () => {
    const result = await startProSubscriptionCheckout({
      upgrade: async () => ({
        error: { message: '   ' },
      }),
      returnUrl: '/',
    })

    expect(result).toEqual({
      ok: false,
      message: 'Failed to start Checkout',
    })
  })
})
