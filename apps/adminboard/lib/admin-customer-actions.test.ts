import { describe, expect, it } from 'vitest'
import type { AdminCustomerProfile } from '@virtality/shared/utils'
import {
  canAssignCustomerAccessGrant,
  canAssignFreeAfterCancellation,
  canCancelCyclePlanChange,
  canCancelPaidBilling,
  canChangePaidPlan,
  canReactivatePaidBilling,
  formatAuditActionLabel,
  formatBillingSnapshotSummary,
} from './admin-customer-actions.ts'

describe('canAssignCustomerAccessGrant', () => {
  it('allows grants for blocked customers without live billing', () => {
    expect(
      canAssignCustomerAccessGrant({
        role: 'user',
        billingStatus: 'absent',
        subscriptionHistory: [],
      } as unknown as AdminCustomerProfile),
    ).toBe(true)
  })

  it('blocks grants for admins and customers with a live Pro subscription', () => {
    expect(
      canAssignCustomerAccessGrant({
        role: 'admin',
        billingStatus: 'absent',
        subscriptionHistory: [],
      } as unknown as AdminCustomerProfile),
    ).toBe(false)
    expect(
      canAssignCustomerAccessGrant({
        role: 'user',
        billingStatus: 'trialing',
        subscriptionHistory: [
          {
            plan: 'pro',
            status: 'trialing',
            cancelAtPeriodEnd: false,
            stripeSubscriptionId: 'sub_1',
          },
        ],
      } as unknown as AdminCustomerProfile),
    ).toBe(false)
  })

  it('allows grants for customers whose only subscription is a Free access-code redemption', () => {
    expect(
      canAssignCustomerAccessGrant({
        role: 'user',
        billingStatus: 'active',
        subscriptionHistory: [
          {
            plan: 'free',
            status: 'active',
            cancelAtPeriodEnd: false,
            stripeSubscriptionId: 'sub_free_1',
          },
        ],
      } as unknown as AdminCustomerProfile),
    ).toBe(true)
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

  it('allows Cancel Cycle plan change when a schedule is pending', () => {
    expect(
      canCancelCyclePlanChange({
        ...paidProfile,
        hasPendingCyclePlanChange: true,
      } as AdminCustomerProfile),
    ).toBe(true)
    expect(
      canCancelCyclePlanChange({
        ...paidProfile,
        hasPendingCyclePlanChange: false,
      } as AdminCustomerProfile),
    ).toBe(false)
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
        assignedProVariant: 'basic',
      }),
    ).toContain('Free')
    expect(
      formatBillingSnapshotSummary({
        role: 'tester',
        stripeCustomerId: 'cus_1',
        primaryPlan: 'free',
        primaryStatus: 'active',
        stripeSubscriptionId: 'sub_1',
        assignedProVariant: 'early-bird',
      }),
    ).toContain('variant early-bird')
    expect(
      formatBillingSnapshotSummary({
        role: 'user',
        stripeCustomerId: null,
        primaryPlan: null,
        primaryStatus: null,
        stripeSubscriptionId: null,
        assignedProVariant: null,
      }),
    ).toContain('no primary subscription')
  })
})

describe('formatAuditActionLabel', () => {
  it('labels assign_pro_variant', () => {
    expect(formatAuditActionLabel('assign_pro_variant')).toBe(
      'Assign Pro variant',
    )
  })

  it('labels legacy grant_timed_trial audit entries', () => {
    expect(formatAuditActionLabel('grant_timed_trial')).toBe(
      'Grant timed trial',
    )
  })

  it('labels trial grant audit actions', () => {
    expect(formatAuditActionLabel('issue_trial_grant')).toBe(
      'Issue trial grant',
    )
    expect(formatAuditActionLabel('revoke_trial_grant')).toBe(
      'Revoke trial grant',
    )
  })
})
