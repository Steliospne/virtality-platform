import { describe, expect, it } from 'vitest'
import { getConsoleUrl } from '@virtality/shared/types'
import {
  CUSTOMER_PORTAL_PROMOTION_CODES_ON_SUBSCRIPTION_UPDATE,
  buildDefaultBillingPortalInput,
  startDefaultBillingPortal,
} from './subscription-billing-portal.js'

const consoleOrigin = getConsoleUrl()

describe('Customer Portal promo posture', () => {
  it('keeps promo-on-subscription-update off', () => {
    expect(CUSTOMER_PORTAL_PROMOTION_CODES_ON_SUBSCRIPTION_UPDATE).toBe(false)
  })

  it('opens portal with returnUrl only (no promo enablement flags)', () => {
    expect(
      buildDefaultBillingPortalInput('/user/abc/profile?tab=billing'),
    ).toEqual({
      returnUrl: `${consoleOrigin}/user/abc/profile?tab=billing`,
    })
  })
})

describe('buildDefaultBillingPortalInput', () => {
  it('resolves relative return paths to absolute console URLs', () => {
    const input = buildDefaultBillingPortalInput(
      '/user/abc/profile?tab=billing',
    )

    expect(input.returnUrl).toBe(
      `${consoleOrigin}/user/abc/profile?tab=billing`,
    )
  })

  it('keeps absolute console return URLs absolute (not auth-host relative)', () => {
    const absolute = `${consoleOrigin}/user/abc/profile?tab=billing`
    const input = buildDefaultBillingPortalInput(absolute)

    expect(input.returnUrl).toBe(absolute)
  })
})

describe('startDefaultBillingPortal', () => {
  it('starts Better Auth billingPortal at the absolute console returnUrl', async () => {
    const calls: unknown[] = []
    const billingPortal = async (input: unknown) => {
      calls.push(input)
      return { data: { url: 'https://billing.stripe.test/session' } }
    }

    const result = await startDefaultBillingPortal({
      billingPortal,
      returnUrl: '/user/abc/profile',
    })

    expect(result).toEqual({ ok: true })
    expect(calls).toEqual([buildDefaultBillingPortalInput('/user/abc/profile')])
  })

  it('surfaces Better Auth portal failures without claiming success', async () => {
    const result = await startDefaultBillingPortal({
      billingPortal: async () => ({
        error: { message: 'No Stripe customer' },
      }),
      returnUrl: '/',
    })

    expect(result).toEqual({
      ok: false,
      message: 'No Stripe customer',
    })
  })

  it('falls back when Better Auth omits an error message', async () => {
    const result = await startDefaultBillingPortal({
      billingPortal: async () => ({
        error: { message: '   ' },
      }),
      returnUrl: '/',
    })

    expect(result).toEqual({
      ok: false,
      message: 'Failed to open Customer Portal',
    })
  })
})
