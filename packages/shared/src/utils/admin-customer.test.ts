import { describe, expect, it } from 'vitest'
import {
  FREE_SUBSCRIPTION_PLAN,
  PRO_SUBSCRIPTION_PLAN,
} from './billing/billing-plans.ts'
import {
  buildStripeCustomerDashboardUrl,
  buildStripeSubscriptionDashboardUrl,
  deriveCustomerAccessStatus,
  deriveCustomerBillingStatus,
  pickPrimaryCustomerSubscription,
  sortCustomerSubscriptionHistory,
} from './admin-customer.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')

describe('pickPrimaryCustomerSubscription', () => {
  it('prefers a live paid Pro subscription over a live Free trial', () => {
    const picked = pickPrimaryCustomerSubscription([
      {
        id: 'sub_free',
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        periodEnd: null,
        endedAt: null,
        canceledAt: null,
      },
      {
        id: 'sub_pro',
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'active',
        trialEnd: null,
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
        endedAt: null,
        canceledAt: null,
      },
    ])

    expect(picked?.id).toBe('sub_pro')
  })

  it('prefers a live Free or trial subscription over ended history', () => {
    const picked = pickPrimaryCustomerSubscription([
      {
        id: 'sub_old',
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'canceled',
        trialEnd: null,
        periodEnd: new Date('2026-07-01T12:00:00.000Z'),
        endedAt: new Date('2026-07-01T12:00:00.000Z'),
        canceledAt: new Date('2026-07-01T12:00:00.000Z'),
      },
      {
        id: 'sub_live',
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        periodEnd: null,
        endedAt: null,
        canceledAt: null,
      },
    ])

    expect(picked?.id).toBe('sub_live')
  })

  it('selects the most recently ended subscription when nothing is live', () => {
    const picked = pickPrimaryCustomerSubscription([
      {
        id: 'sub_older',
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'canceled',
        trialEnd: null,
        periodEnd: new Date('2026-05-01T12:00:00.000Z'),
        endedAt: new Date('2026-05-01T12:00:00.000Z'),
        canceledAt: new Date('2026-05-01T12:00:00.000Z'),
      },
      {
        id: 'sub_recent',
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'canceled',
        trialEnd: null,
        periodEnd: new Date('2026-07-15T12:00:00.000Z'),
        endedAt: new Date('2026-07-15T12:00:00.000Z'),
        canceledAt: new Date('2026-07-15T12:00:00.000Z'),
      },
    ])

    expect(picked?.id).toBe('sub_recent')
  })
})

describe('deriveCustomerAccessStatus', () => {
  it('labels entitled Pro clinicians as paid access', () => {
    expect(
      deriveCustomerAccessStatus({
        now: NOW,
        role: 'user',
        subscriptions: [
          {
            plan: PRO_SUBSCRIPTION_PLAN,
            status: 'active',
            trialEnd: null,
            periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          },
        ],
      }),
    ).toBe('paid')
  })

  it('labels a live Free trial as trialing access', () => {
    expect(
      deriveCustomerAccessStatus({
        now: NOW,
        role: 'user',
        subscriptions: [
          {
            plan: FREE_SUBSCRIPTION_PLAN,
            status: 'trialing',
            trialEnd: new Date('2026-08-20T12:00:00.000Z'),
            periodEnd: null,
          },
        ],
      }),
    ).toBe('trialing')
  })

  it('labels post-trial Free seats as free access', () => {
    expect(
      deriveCustomerAccessStatus({
        now: NOW,
        role: 'user',
        subscriptions: [
          {
            plan: FREE_SUBSCRIPTION_PLAN,
            status: 'active',
            trialEnd: new Date('2026-08-01T12:00:00.000Z'),
            periodEnd: new Date('2026-09-01T12:00:00.000Z'),
          },
        ],
      }),
    ).toBe('free')
  })

  it('labels clinicians without entitlement as blocked', () => {
    expect(
      deriveCustomerAccessStatus({
        now: NOW,
        role: 'user',
        subscriptions: [],
      }),
    ).toBe('blocked')
  })

  it('preserves admin and tester role indicators', () => {
    expect(
      deriveCustomerAccessStatus({
        now: NOW,
        role: 'admin',
        subscriptions: [],
      }),
    ).toBe('admin')
    expect(
      deriveCustomerAccessStatus({
        now: NOW,
        role: 'tester',
        subscriptions: [],
      }),
    ).toBe('tester')
  })
})

describe('deriveCustomerBillingStatus', () => {
  it('returns absent when there is no primary subscription', () => {
    expect(deriveCustomerBillingStatus(null)).toBe('absent')
  })

  it('maps live and ended subscription statuses for billing summaries', () => {
    expect(
      deriveCustomerBillingStatus({
        id: 'sub_1',
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'active',
        trialEnd: null,
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
        endedAt: null,
        canceledAt: null,
      }),
    ).toBe('active')
    expect(
      deriveCustomerBillingStatus({
        id: 'sub_2',
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        periodEnd: null,
        endedAt: null,
        canceledAt: null,
      }),
    ).toBe('trialing')
    expect(
      deriveCustomerBillingStatus({
        id: 'sub_3',
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'past_due',
        trialEnd: null,
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
        endedAt: null,
        canceledAt: null,
      }),
    ).toBe('past_due')
    expect(
      deriveCustomerBillingStatus({
        id: 'sub_4',
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'canceled',
        trialEnd: null,
        periodEnd: new Date('2026-07-01T12:00:00.000Z'),
        endedAt: new Date('2026-07-01T12:00:00.000Z'),
        canceledAt: new Date('2026-07-01T12:00:00.000Z'),
      }),
    ).toBe('canceled')
  })
})

describe('sortCustomerSubscriptionHistory', () => {
  it('orders subscriptions with the most recent history first', () => {
    const sorted = sortCustomerSubscriptionHistory([
      {
        id: 'sub_old',
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'canceled',
        trialEnd: null,
        periodEnd: new Date('2026-05-01T12:00:00.000Z'),
        endedAt: new Date('2026-05-01T12:00:00.000Z'),
        canceledAt: new Date('2026-05-01T12:00:00.000Z'),
      },
      {
        id: 'sub_live',
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
        periodEnd: null,
        endedAt: null,
        canceledAt: null,
      },
    ])

    expect(sorted.map((row) => row.id)).toEqual(['sub_live', 'sub_old'])
  })
})

describe('Stripe dashboard links', () => {
  it('builds test-mode customer and subscription URLs', () => {
    expect(buildStripeCustomerDashboardUrl('cus_123', 'test')).toBe(
      'https://dashboard.stripe.com/test/customers/cus_123',
    )
    expect(buildStripeSubscriptionDashboardUrl('sub_123', 'test')).toBe(
      'https://dashboard.stripe.com/test/subscriptions/sub_123',
    )
  })

  it('builds live-mode customer and subscription URLs', () => {
    expect(buildStripeCustomerDashboardUrl('cus_123', 'live')).toBe(
      'https://dashboard.stripe.com/customers/cus_123',
    )
    expect(buildStripeSubscriptionDashboardUrl('sub_123', 'live')).toBe(
      'https://dashboard.stripe.com/subscriptions/sub_123',
    )
  })
})
