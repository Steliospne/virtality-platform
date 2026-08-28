import { describe, expect, it } from 'vitest'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import {
  canAssignCustomerAccessGrant,
  canAssignFreeAfterCancellation,
  canCancelPaidBilling,
  canChangePaidPlan,
  canReactivatePaidBilling,
  formatBillingSnapshotSummary,
} from './admin-customer-actions.ts'

describe('canAssignCustomerAccessGrant', () => {
  it('allows grants for blocked customers without live billing', () => {
    expect(
      canAssignCustomerAccessGrant({
        role: 'user',
        billingStatus: 'absent',
      } as AdminCustomerProfile),
    ).toBe(true)
  })

  it('blocks grants for admins and live billed customers', () => {
    expect(
      canAssignCustomerAccessGrant({
        role: 'admin',
        billingStatus: 'absent',
      } as AdminCustomerProfile),
    ).toBe(false)
    expect(
      canAssignCustomerAccessGrant({
        role: 'user',
        billingStatus: 'trialing',
      } as AdminCustomerProfile),
    ).toBe(false)
  })
})

describe('paid billing administration eligibility', () => {
  const paidProfile = {
    role: 'user',
    billingStatus: 'active',
    accessStatus: 'paid',
    subscriptionHistory: [
      {
        plan: 'pro',
        status: 'active',
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'sub_1',
      },
    ],
  } as AdminCustomerProfile

  it('allows cancel for active paid customers', () => {
    expect(canCancelPaidBilling(paidProfile)).toBe(true)
    expect(canReactivatePaidBilling(paidProfile)).toBe(false)
  })

  it('allows reactivate when cancellation is scheduled', () => {
    expect(
      canReactivatePaidBilling({
        ...paidProfile,
        subscriptionHistory: [
          {
            plan: 'pro',
            status: 'active',
            cancelAtPeriodEnd: true,
            stripeSubscriptionId: 'sub_1',
          },
        ],
      } as AdminCustomerProfile),
    ).toBe(true)
  })

  it('allows assign Free after cancellation for paid history or live paid Pro', () => {
    expect(canAssignFreeAfterCancellation(paidProfile)).toBe(true)
    expect(
      canAssignFreeAfterCancellation({
        role: 'user',
        billingStatus: 'canceled',
        accessStatus: 'blocked',
        subscriptionHistory: [
          {
            plan: 'pro',
            status: 'canceled',
            trialEnd: new Date('2026-07-01T12:00:00.000Z'),
            periodEnd: new Date('2026-08-01T12:00:00.000Z'),
            endedAt: new Date('2026-08-01T12:00:00.000Z'),
          },
        ],
      } as AdminCustomerProfile),
    ).toBe(true)
  })

  it('rejects assign Free after cancellation for trial-only canceled seats', () => {
    expect(
      canAssignFreeAfterCancellation({
        role: 'user',
        billingStatus: 'canceled',
        accessStatus: 'blocked',
        subscriptionHistory: [
          {
            plan: 'pro',
            status: 'canceled',
            trialEnd: new Date('2026-08-01T12:00:00.000Z'),
            periodEnd: new Date('2026-08-01T12:00:00.000Z'),
            endedAt: new Date('2026-08-01T12:00:00.000Z'),
          },
        ],
      } as AdminCustomerProfile),
    ).toBe(false)
  })

  it('rejects assign Free after cancellation for never-subscribed Free seats', () => {
    expect(
      canAssignFreeAfterCancellation({
        role: 'user',
        billingStatus: 'absent',
        accessStatus: 'free',
        subscriptionHistory: [] as AdminCustomerProfile['subscriptionHistory'],
      } as AdminCustomerProfile),
    ).toBe(false)
  })

  it('allows paid plan changes for non-admin customers without live trialing billing', () => {
    expect(
      canChangePaidPlan({
        role: 'user',
        billingStatus: 'absent',
        accessStatus: 'free',
      } as AdminCustomerProfile),
    ).toBe(true)
    expect(
      canChangePaidPlan({
        role: 'admin',
        billingStatus: 'absent',
        accessStatus: 'admin',
      } as AdminCustomerProfile),
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
