import { describe, expect, it } from 'vitest'
import {
  buildProCheckoutUpgradeInput,
  PRO_SUBSCRIPTION_PLAN,
  startProSubscriptionCheckout,
} from './subscription-checkout.js'
import { formatCheckoutCtaLabel } from '@virtality/shared/utils'

describe('buildProCheckoutUpgradeInput', () => {
  it('targets the canonical pro plan for Better Auth Checkout', () => {
    const input = buildProCheckoutUpgradeInput({
      successUrl: '/app',
      cancelUrl: '/app',
    })

    expect(input.plan).toBe(PRO_SUBSCRIPTION_PLAN)
    expect(input.plan).toBe('pro')
    expect(input.successUrl).toBe('/app')
    expect(input.cancelUrl).toBe('/app')
  })

  it('does not request a trial period on the paid Checkout path', () => {
    const input = buildProCheckoutUpgradeInput({
      successUrl: '/',
      cancelUrl: '/',
    })

    expect(input).not.toHaveProperty('trialDays')
    expect(input).not.toHaveProperty('freeTrial')
    expect(input).not.toHaveProperty('annual')
  })
})

describe('startProSubscriptionCheckout', () => {
  it('starts the same subscription upgrade for Subscribe and Renew labels', async () => {
    const calls: unknown[] = []
    const upgrade = async (input: unknown) => {
      calls.push(input)
      return { data: { url: 'https://checkout.stripe.test/cs_test' } }
    }

    for (const cta of ['subscribe', 'renew'] as const) {
      expect(formatCheckoutCtaLabel(cta)).toBe(
        cta === 'subscribe' ? 'Subscribe' : 'Renew',
      )

      const result = await startProSubscriptionCheckout({
        upgrade,
        returnUrl: '/patients',
      })

      expect(result).toEqual({ ok: true })
    }

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual(
      buildProCheckoutUpgradeInput({
        successUrl: '/patients',
        cancelUrl: '/patients',
      }),
    )
    expect(calls[1]).toEqual(calls[0])
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
})
