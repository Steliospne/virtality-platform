import { describe, expect, it } from 'vitest'
import {
  canAssignCustomerAccessGrant,
  formatBillingSnapshotSummary,
} from './admin-customer-actions.ts'

describe('canAssignCustomerAccessGrant', () => {
  it('allows grants for blocked customers without live billing', () => {
    expect(
      canAssignCustomerAccessGrant({
        role: 'user',
        billingStatus: 'absent',
      } as never),
    ).toBe(true)
  })

  it('blocks grants for admins and live billed customers', () => {
    expect(
      canAssignCustomerAccessGrant({
        role: 'admin',
        billingStatus: 'absent',
      } as never),
    ).toBe(false)
    expect(
      canAssignCustomerAccessGrant({
        role: 'user',
        billingStatus: 'trialing',
      } as never),
    ).toBe(false)
  })
})

describe('formatBillingSnapshotSummary', () => {
  it('summarizes plan and billing state for audit rows', () => {
    expect(
      formatBillingSnapshotSummary({
        role: 'tester',
        stripeCustomerId: 'cus_1',
        primaryPlan: 'free',
        primaryStatus: 'active',
        stripeSubscriptionId: 'sub_1',
      }),
    ).toContain('Free')
    expect(
      formatBillingSnapshotSummary({
        role: 'user',
        stripeCustomerId: null,
        primaryPlan: null,
        primaryStatus: null,
        stripeSubscriptionId: null,
      }),
    ).toContain('no primary subscription')
  })
})
