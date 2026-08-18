import { describe, expect, it } from 'vitest'
import { resolveBillingFeatureEnabled } from './billing-feature.ts'

describe('resolveBillingFeatureEnabled', () => {
  it('stays disabled before mount even when PostHog already has the flag', () => {
    expect(resolveBillingFeatureEnabled(false, { enabled: true })).toBe(false)
  })

  it('enables only after mount when the flag is on', () => {
    expect(resolveBillingFeatureEnabled(true, { enabled: true })).toBe(true)
  })

  it('stays hidden when the flag is off or missing', () => {
    expect(resolveBillingFeatureEnabled(true, { enabled: false })).toBe(false)
    expect(resolveBillingFeatureEnabled(true, null)).toBe(false)
  })
})
