import { describe, expect, it } from 'vitest'
import {
  formatCustomerEntitlementSummary,
  formatCustomerInitials,
  formatCustomerSubscriptionDate,
} from './admin-customer-display.ts'

describe('admin customer display helpers', () => {
  it('summarizes live Entitlement Clock state for the profile', () => {
    expect(
      formatCustomerEntitlementSummary({
        entitled: true,
        remainingMs: 7 * 24 * 60 * 60 * 1000,
        clockEnd: new Date('2026-08-17T12:00:00.000Z'),
      }),
    ).toBe('7d remaining (ends 17 Aug 2026, 12:00 UTC)')
    expect(
      formatCustomerEntitlementSummary({
        entitled: false,
        remainingMs: 0,
        clockEnd: null,
      }),
    ).toBe('Expired')
  })

  it('formats subscription history dates in UTC', () => {
    expect(formatCustomerSubscriptionDate(null)).toBe('-')
    expect(
      formatCustomerSubscriptionDate(new Date('2026-08-17T12:00:00.000Z')),
    ).toBe('17 Aug 2026, 12:00 UTC')
  })

  it('builds initials for the profile rail avatar', () => {
    expect(formatCustomerInitials('Maria Kouros')).toBe('MK')
    expect(formatCustomerInitials('Ada')).toBe('A')
  })
})
