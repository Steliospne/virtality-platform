import { describe, expect, it } from 'vitest'
import { resolveBillingFeatureEnabled } from './billing-feature.ts'

describe('resolveBillingFeatureEnabled', () => {
  it('is disabled on the live production site', () => {
    expect(resolveBillingFeatureEnabled('production')).toBe(false)
  })

  it('is enabled in preview', () => {
    expect(resolveBillingFeatureEnabled('preview')).toBe(true)
  })

  it('is enabled in local dev (undefined NEXT_PUBLIC_ENV)', () => {
    expect(resolveBillingFeatureEnabled(undefined)).toBe(true)
  })
})
