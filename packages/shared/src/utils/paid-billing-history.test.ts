import { describe, expect, it } from 'vitest'
import { FREE_SUBSCRIPTION_PLAN } from './billing-plans.ts'
import { hadPaidBillingHistory } from './paid-billing-history.ts'

describe('hadPaidBillingHistory', () => {
  it('is false for canceled trial-only seats where period ended with trial', () => {
    expect(
      hadPaidBillingHistory([
        {
          status: 'canceled',
          trialEnd: new Date('2026-08-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
      ]),
    ).toBe(false)
  })

  it('is false for active Free seats after trial expiry', () => {
    expect(
      hadPaidBillingHistory([
        {
          plan: FREE_SUBSCRIPTION_PLAN,
          status: 'active',
          trialEnd: new Date('2026-08-01T12:00:00.000Z'),
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
        },
      ]),
    ).toBe(false)
  })

  it('is true when a paid period continued past trial end', () => {
    expect(
      hadPaidBillingHistory([
        {
          status: 'canceled',
          trialEnd: new Date('2026-07-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
      ]),
    ).toBe(true)
  })

  it('is true for delinquency statuses that imply a paid relationship', () => {
    expect(hadPaidBillingHistory([{ status: 'past_due' }])).toBe(true)
    expect(hadPaidBillingHistory([{ status: 'unpaid' }])).toBe(true)
    expect(hadPaidBillingHistory([{ status: 'paused' }])).toBe(true)
  })

  it('is true for active paid seats without trial fields', () => {
    expect(hadPaidBillingHistory([{ status: 'active' }])).toBe(true)
  })

  it('is false when canceled with no period end', () => {
    expect(hadPaidBillingHistory([{ status: 'canceled' }])).toBe(false)
  })
})
