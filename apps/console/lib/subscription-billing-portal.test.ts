import { describe, expect, it } from 'vitest'
import { getConsoleUrl } from '@virtality/shared/types'
import {
  buildProBillingPortalInput,
  startProBillingPortal,
} from './subscription-billing-portal.js'

const consoleOrigin = getConsoleUrl()

describe('buildProBillingPortalInput', () => {
  it('resolves relative return paths to absolute console URLs', () => {
    const input = buildProBillingPortalInput('/user/abc/profile?tab=billing')

    expect(input.returnUrl).toBe(
      `${consoleOrigin}/user/abc/profile?tab=billing`,
    )
  })

  it('keeps absolute console return URLs absolute (not auth-host relative)', () => {
    const absolute = `${consoleOrigin}/user/abc/profile?tab=billing`
    const input = buildProBillingPortalInput(absolute)

    expect(input.returnUrl).toBe(absolute)
  })
})

describe('startProBillingPortal', () => {
  it('starts Better Auth billingPortal at the absolute console returnUrl', async () => {
    const calls: unknown[] = []
    const billingPortal = async (input: unknown) => {
      calls.push(input)
      return { data: { url: 'https://billing.stripe.test/session' } }
    }

    const result = await startProBillingPortal({
      billingPortal,
      returnUrl: '/user/abc/profile',
    })

    expect(result).toEqual({ ok: true })
    expect(calls).toEqual([buildProBillingPortalInput('/user/abc/profile')])
  })

  it('surfaces Better Auth portal failures without claiming success', async () => {
    const result = await startProBillingPortal({
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
    const result = await startProBillingPortal({
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
