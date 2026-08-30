import { describe, expect, it } from 'vitest'
import { checkoutSuccessCopy } from './checkout-success-copy.js'

describe('checkoutSuccessCopy', () => {
  it('gives Subscribe intent a distinct feel-good headline and subcopy', () => {
    const copy = checkoutSuccessCopy('subscribe')

    expect(copy.headline.length).toBeGreaterThan(0)
    expect(copy.subcopy.length).toBeGreaterThan(0)
  })

  it('gives Renew intent a distinct feel-good headline and subcopy', () => {
    const copy = checkoutSuccessCopy('renew')

    expect(copy.headline.length).toBeGreaterThan(0)
    expect(copy.subcopy.length).toBeGreaterThan(0)
  })

  it('never uses an em dash in either intent copy', () => {
    for (const intent of ['subscribe', 'renew'] as const) {
      const copy = checkoutSuccessCopy(intent)
      expect(copy.headline).not.toContain('—')
      expect(copy.subcopy).not.toContain('—')
    }
  })

  it('renders different copy for Subscribe vs Renew', () => {
    const subscribe = checkoutSuccessCopy('subscribe')
    const renew = checkoutSuccessCopy('renew')

    expect(subscribe.headline).not.toBe(renew.headline)
    expect(subscribe.subcopy).not.toBe(renew.subcopy)
  })
})
