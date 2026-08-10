import { describe, expect, it } from 'vitest'
import {
  buildProCheckoutUpgradeInput,
  checkoutEntitlementRestoreRefetchInterval,
  PRO_SUBSCRIPTION_PLAN,
  readCheckoutReturnIntent,
  startProSubscriptionCheckout,
  stripCheckoutReturnIntent,
  withCheckoutReturnIntent,
} from './subscription-checkout.js'

describe('buildProCheckoutUpgradeInput', () => {
  it('targets the canonical pro plan and marks success vs cancel return on the console URL', () => {
    const input = buildProCheckoutUpgradeInput('/app')

    expect(input).toEqual({
      plan: PRO_SUBSCRIPTION_PLAN,
      successUrl: withCheckoutReturnIntent('/app', 'success'),
      cancelUrl: withCheckoutReturnIntent('/app', 'cancel'),
    })
    expect(
      readCheckoutReturnIntent(new URL(input.successUrl, 'http://x').search),
    ).toBe('success')
    expect(
      readCheckoutReturnIntent(new URL(input.cancelUrl, 'http://x').search),
    ).toBe('cancel')
  })

  it('preserves existing query params on the return URL', () => {
    const input = buildProCheckoutUpgradeInput('/patients?tab=devices')

    expect(input.successUrl).toBe(
      withCheckoutReturnIntent('/patients?tab=devices', 'success'),
    )
    expect(input.cancelUrl).toBe(
      withCheckoutReturnIntent('/patients?tab=devices', 'cancel'),
    )
  })

  it('does not request a trial period on the paid Checkout path', () => {
    const input = buildProCheckoutUpgradeInput('/')

    expect(input).not.toHaveProperty('trialDays')
    expect(input).not.toHaveProperty('freeTrial')
    expect(input).not.toHaveProperty('annual')
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
      checkoutEntitlementRestoreRefetchInterval({
        intent: 'success',
        entitled: false,
        startedAtMs: 0,
        nowMs: 1_000,
      }),
    ).toBe(2_000)

    expect(
      checkoutEntitlementRestoreRefetchInterval({
        intent: 'cancel',
        entitled: false,
        startedAtMs: 0,
        nowMs: 1_000,
      }),
    ).toBe(false)

    expect(
      checkoutEntitlementRestoreRefetchInterval({
        intent: 'success',
        entitled: true,
        startedAtMs: 0,
        nowMs: 1_000,
      }),
    ).toBe(false)

    expect(
      checkoutEntitlementRestoreRefetchInterval({
        intent: 'success',
        entitled: false,
        startedAtMs: 0,
        nowMs: 60_000,
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
