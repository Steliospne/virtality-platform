import { describe, expect, it } from 'vitest'
import {
  buildAdminCustomerProfile,
  type AdminCustomerProfileSubscriptionRow,
} from './admin-customer-profile.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')

function subscription(
  overrides: Partial<AdminCustomerProfileSubscriptionRow> &
    Pick<AdminCustomerProfileSubscriptionRow, 'id' | 'plan' | 'status'>,
): AdminCustomerProfileSubscriptionRow {
  return {
    referenceId: 'user_1',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    periodStart: null,
    periodEnd: null,
    cancelAtPeriodEnd: null,
    canceledAt: null,
    endedAt: null,
    trialStart: null,
    trialEnd: null,
    billingInterval: null,
    stripeScheduleId: null,
    ...overrides,
  }
}

describe('buildAdminCustomerProfile', () => {
  it('assembles subscription history and Stripe links from raw rows', () => {
    const profile = buildAdminCustomerProfile({
      user: {
        id: 'user_1',
        name: 'Profile User',
        email: 'profile@example.com',
        role: 'user',
        stripeCustomerId: 'cus_123',
        assignedDefaultVariant: null,
        createdAt: NOW,
      },
      subscriptions: [
        subscription({
          id: 'sub_old',
          plan: 'default',
          status: 'canceled',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_old',
          periodEnd: new Date('2026-07-01T12:00:00.000Z'),
          endedAt: new Date('2026-07-01T12:00:00.000Z'),
          canceledAt: new Date('2026-07-01T12:00:00.000Z'),
        }),
        subscription({
          id: 'sub_live',
          plan: 'free',
          status: 'trialing',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_live',
          trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        }),
      ],
      trialGrantContext: {
        openTrialGrantClock: null,
        trialGrant: null,
      },
      auditHistory: [],
      stripeMode: 'test',
      now: NOW,
    })

    expect(profile).toMatchObject({
      userId: 'user_1',
      accessStatus: 'trialing',
      billingStatus: 'trialing',
      stripeLinks: {
        customerUrl: 'https://dashboard.stripe.com/test/customers/cus_123',
        primarySubscriptionUrl:
          'https://dashboard.stripe.com/test/subscriptions/sub_live',
      },
      entitlement: {
        entitled: true,
        canLaunchVr: true,
      },
    })
    expect(profile.subscriptionHistory.map((row) => row.id)).toEqual([
      'sub_live',
      'sub_old',
    ])
    expect(profile.hasPendingCyclePlanChange).toBe(false)
    expect(profile.auditHistory).toEqual([])
  })

  it('flags hasPendingCyclePlanChange when live Default has a Stripe schedule', () => {
    const profile = buildAdminCustomerProfile({
      user: {
        id: 'user_paid',
        name: 'Paid User',
        email: 'paid@example.com',
        role: 'user',
        stripeCustomerId: 'cus_paid',
        assignedDefaultVariant: null,
        createdAt: NOW,
      },
      subscriptions: [
        subscription({
          id: 'sub_pro',
          plan: 'default',
          status: 'active',
          referenceId: 'user_paid',
          stripeCustomerId: 'cus_paid',
          stripeSubscriptionId: 'sub_pro',
          billingInterval: 'month',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          cancelAtPeriodEnd: false,
          stripeScheduleId: 'sub_sched_1',
        }),
      ],
      trialGrantContext: {
        openTrialGrantClock: null,
        trialGrant: null,
      },
      auditHistory: [],
      stripeMode: 'test',
      now: NOW,
    })

    expect(profile.hasPendingCyclePlanChange).toBe(true)
    expect(profile.subscriptionHistory[0]?.stripeScheduleId).toBe('sub_sched_1')
  })

  it('includes owned trial grant entitlement when no Stripe subscription exists', () => {
    const profile = buildAdminCustomerProfile({
      user: {
        id: 'user_grant',
        name: 'Grant User',
        email: 'grant@example.com',
        role: 'user',
        stripeCustomerId: null,
        assignedDefaultVariant: null,
        createdAt: NOW,
      },
      subscriptions: [],
      trialGrantContext: {
        openTrialGrantClock: {
          status: 'active',
          trialStart: NOW,
          trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        },
        trialGrant: {
          id: 'grant_1',
          status: 'active',
          trialStart: NOW,
          trialEnd: new Date('2026-08-20T12:00:00.000Z'),
          createdAt: new Date('2026-08-01T12:00:00.000Z'),
          entitled: true,
          remainingMs: 10 * 24 * 60 * 60 * 1000,
        },
      },
      auditHistory: [],
      stripeMode: 'test',
      now: NOW,
    })

    expect(profile.trialGrant).toMatchObject({
      status: 'active',
      entitled: true,
    })
    expect(profile.entitlement).toMatchObject({
      entitled: true,
      canLaunchVr: true,
    })
  })

  it('reports blocked access and absent billing when there are no subscriptions or trial grant', () => {
    const profile = buildAdminCustomerProfile({
      user: {
        id: 'user_none',
        name: 'No Billing',
        email: 'nobilling@example.com',
        role: 'user',
        stripeCustomerId: null,
        assignedDefaultVariant: null,
        createdAt: NOW,
      },
      subscriptions: [],
      trialGrantContext: {
        openTrialGrantClock: null,
        trialGrant: null,
      },
      auditHistory: [],
      stripeMode: 'test',
      now: NOW,
    })

    expect(profile).toMatchObject({
      accessStatus: 'blocked',
      billingStatus: 'absent',
      stripeLinks: {
        customerUrl: null,
        primarySubscriptionUrl: null,
      },
      entitlement: {
        entitled: false,
        canLaunchVr: false,
      },
      canChangeAssignedPlanVariant: true,
    })
  })
})
