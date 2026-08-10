import { describe, expect, it } from 'vitest'
import {
  buildProCheckoutUpgradeInput,
  PRO_SUBSCRIPTION_PLAN,
  startProSubscriptionCheckout,
} from './subscription-checkout.js'

describe('buildProCheckoutUpgradeInput', () => {
  it('targets the canonical pro plan and returns to the same URL on success or cancel', () => {
    const input = buildProCheckoutUpgradeInput('/app')

    expect(input).toEqual({
      plan: PRO_SUBSCRIPTION_PLAN,
      successUrl: '/app',
      cancelUrl: '/app',
    })
  })

  it('does not request a trial period on the paid Checkout path', () => {
    const input = buildProCheckoutUpgradeInput('/')

    expect(input).not.toHaveProperty('trialDays')
    expect(input).not.toHaveProperty('freeTrial')
    expect(input).not.toHaveProperty('annual')
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
