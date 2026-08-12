import { describe, expect, it } from 'vitest'
import {
  buildProCheckoutUpgradeInput,
  CHECKOUT_ENTITLEMENT_RESTORE_MAX_MS,
  CHECKOUT_RETURN_PARAM,
  PRO_SUBSCRIPTION_PLAN,
  readCheckoutReturnIntent,
  shouldPollCheckoutEntitlementRestore,
  startProSubscriptionCheckout,
  stripCheckoutReturnIntent,
} from './subscription-checkout.js'

describe('buildProCheckoutUpgradeInput', () => {
  it('targets the canonical pro plan and marks success vs cancel return on the console URL', () => {
    const input = buildProCheckoutUpgradeInput('/app')

    expect(input.plan).toBe(PRO_SUBSCRIPTION_PLAN)
    expect(
      readCheckoutReturnIntent(new URL(input.successUrl, 'http://x').search),
    ).toBe('success')
    expect(
      readCheckoutReturnIntent(new URL(input.cancelUrl, 'http://x').search),
    ).toBe('cancel')
    expect(new URL(input.successUrl, 'http://x').pathname).toBe('/app')
    expect(new URL(input.cancelUrl, 'http://x').pathname).toBe('/app')
  })

  it('preserves existing query params on the return URL', () => {
    const input = buildProCheckoutUpgradeInput('/patients?tab=devices')
    const success = new URL(input.successUrl, 'http://x')
    const cancel = new URL(input.cancelUrl, 'http://x')

    expect(success.pathname).toBe('/patients')
    expect(success.searchParams.get('tab')).toBe('devices')
    expect(success.searchParams.get(CHECKOUT_RETURN_PARAM)).toBe('success')
    expect(cancel.searchParams.get('tab')).toBe('devices')
    expect(cancel.searchParams.get(CHECKOUT_RETURN_PARAM)).toBe('cancel')
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
})

describe('checkout return intent', () => {
  it('reads success and cancel markers from the search string', () => {
    expect(readCheckoutReturnIntent('?checkoutReturn=success')).toBe('success')
    expect(readCheckoutReturnIntent('?checkoutReturn=cancel')).toBe('cancel')
    expect(readCheckoutReturnIntent('')).toBeNull()
    expect(readCheckoutReturnIntent('?other=1')).toBeNull()
  })

  it('strips the checkout return marker without dropping other params', () => {
    expect(stripCheckoutReturnIntent('/app?checkoutReturn=success&tab=1')).toBe(
      '/app?tab=1',
    )
    expect(stripCheckoutReturnIntent('/app?checkoutReturn=cancel')).toBe('/app')
  })

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
    })

    expect(result).toEqual({ ok: true })
    expect(calls).toEqual([buildProCheckoutUpgradeInput('/patients')])
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
