import { describe, expect, it } from 'vitest'
import {
  FREE_SUBSCRIPTION_PLAN,
  PRO_SUBSCRIPTION_PLAN,
} from './billing-plans.ts'
import {
  buildEntitlementStanding,
  canLaunchVrPrograms,
  formatCheckoutCtaLabel,
  formatEntitlementClockEndLabel,
  formatRemainingTimeLabel,
  pickEntitlementSubscription,
  projectLiveEntitlementStanding,
  remainingMsFromClockEnd,
  resolveCheckoutCta,
  resolveProfileBillingCheckoutCta,
  resolveEntitlementClock,
  showsRemainingTimeSidebar,
} from './entitlement-clock.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')

describe('resolveEntitlementClock', () => {
  it('counts Remaining Time down to trialEnd while trialing', () => {
    const trialEnd = new Date('2026-08-17T12:00:00.000Z')
    const standing = resolveEntitlementClock({
      now: NOW,
      subscription: {
        status: 'trialing',
        trialEnd,
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
      },
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(trialEnd)
    expect(standing.remainingMs).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('counts Remaining Time down to periodEnd while active', () => {
    const periodEnd = new Date('2026-09-10T12:00:00.000Z')
    const standing = resolveEntitlementClock({
      now: NOW,
      subscription: {
        status: 'active',
        trialEnd: new Date('2026-07-01T12:00:00.000Z'),
        periodEnd,
      },
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(periodEnd)
    expect(standing.remainingMs).toBe(31 * 24 * 60 * 60 * 1000)
  })

  it('shows zero Remaining Time when not entitled and never goes negative', () => {
    const standing = resolveEntitlementClock({
      now: NOW,
      subscription: {
        status: 'canceled',
        trialEnd: new Date('2026-07-01T12:00:00.000Z'),
        periodEnd: new Date('2026-07-15T12:00:00.000Z'),
      },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
    expect(standing.clockEnd).toBeNull()
  })

  it('treats non-active/non-trialing status as expired even with a future periodEnd', () => {
    const standing = resolveEntitlementClock({
      now: NOW,
      subscription: {
        status: 'past_due',
        trialEnd: null,
        periodEnd: new Date('2026-12-01T12:00:00.000Z'),
      },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
  })

  it('is not entitled when the clock end is at or before now', () => {
    const standing = resolveEntitlementClock({
      now: NOW,
      subscription: {
        status: 'active',
        trialEnd: null,
        periodEnd: NOW,
      },
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
  })

  it('is not entitled with no Subscription', () => {
    const standing = resolveEntitlementClock({
      now: NOW,
      subscription: null,
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
    expect(standing.clockEnd).toBeNull()
  })

  it('keeps cancel-at-period-end active seats entitled until periodEnd', () => {
    const periodEnd = new Date('2026-08-20T12:00:00.000Z')
    const standing = resolveEntitlementClock({
      now: NOW,
      subscription: {
        status: 'active',
        trialEnd: null,
        periodEnd,
      },
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(periodEnd)
  })
})

describe('pickEntitlementSubscription', () => {
  it('prefers a live paid Pro row over a live Free trial', () => {
    const picked = pickEntitlementSubscription([
      {
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
      },
      {
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'active',
        periodEnd: new Date('2026-09-10T12:00:00.000Z'),
      },
    ])

    expect(picked?.status).toBe('active')
    expect(picked?.plan).toBe(PRO_SUBSCRIPTION_PLAN)
  })

  it('prefers a live active or trialing row over expired history', () => {
    const picked = pickEntitlementSubscription([
      {
        status: 'canceled',
        periodEnd: new Date('2026-07-01T12:00:00.000Z'),
      },
      {
        status: 'trialing',
        trialEnd: new Date('2026-08-20T12:00:00.000Z'),
      },
    ])

    expect(picked?.status).toBe('trialing')
  })
})

describe('canLaunchVrPrograms', () => {
  it('allows launch when entitled', () => {
    expect(canLaunchVrPrograms({ entitled: true, role: 'user' })).toBe(true)
  })

  it('blocks launch when not entitled', () => {
    expect(canLaunchVrPrograms({ entitled: false, role: 'user' })).toBe(false)
  })

  it('allows admin and tester without entitlement', () => {
    expect(canLaunchVrPrograms({ entitled: false, role: 'admin' })).toBe(true)
    expect(canLaunchVrPrograms({ entitled: false, role: 'tester' })).toBe(true)
  })
})

describe('formatRemainingTimeLabel', () => {
  it('labels zero or negative remaining as Expired', () => {
    expect(formatRemainingTimeLabel(0)).toBe('Expired')
    expect(formatRemainingTimeLabel(-1000)).toBe('Expired')
  })

  it('formats multi-day remaining time', () => {
    expect(formatRemainingTimeLabel(7 * 24 * 60 * 60 * 1000)).toBe('7d')
    expect(
      formatRemainingTimeLabel(7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    ).toBe('7d 3h')
  })
})

describe('formatEntitlementClockEndLabel', () => {
  it('formats the Entitlement Clock end in en-GB UTC', () => {
    expect(
      formatEntitlementClockEndLabel(new Date('2026-08-17T12:00:00.000Z')),
    ).toBe('17 Aug 2026, 12:00 UTC')
  })
})

describe('remainingMsFromClockEnd', () => {
  it('never returns a negative Remaining Time', () => {
    expect(remainingMsFromClockEnd(null, NOW)).toBe(0)
    expect(
      remainingMsFromClockEnd(new Date('2026-08-01T12:00:00.000Z'), NOW),
    ).toBe(0)
  })

  it('counts down from a future clock end', () => {
    expect(
      remainingMsFromClockEnd(new Date('2026-08-11T12:00:00.000Z'), NOW),
    ).toBe(24 * 60 * 60 * 1000)
  })
})

describe('showsRemainingTimeSidebar', () => {
  it('shows for entitled trialing seats', () => {
    expect(
      showsRemainingTimeSidebar({ entitled: true, status: 'trialing' }),
    ).toBe(true)
  })

  it('shows for entitled active seats scheduled to cancel at period end', () => {
    expect(
      showsRemainingTimeSidebar({
        entitled: true,
        status: 'active',
        cancelAtPeriodEnd: true,
      }),
    ).toBe(true)
  })

  it('hides for entitled renewing active seats and when not entitled', () => {
    expect(
      showsRemainingTimeSidebar({ entitled: true, status: 'active' }),
    ).toBe(false)
    expect(
      showsRemainingTimeSidebar({
        entitled: true,
        status: 'active',
        cancelAtPeriodEnd: false,
      }),
    ).toBe(false)
    expect(
      showsRemainingTimeSidebar({ entitled: false, status: 'trialing' }),
    ).toBe(false)
    expect(showsRemainingTimeSidebar({ entitled: true, status: null })).toBe(
      false,
    )
  })
})

describe('buildEntitlementStanding', () => {
  it('blocks VR for expired clinicians and allows admin bypass', () => {
    const expired = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [{ status: 'canceled', periodEnd: NOW }],
    })
    expect(expired.entitled).toBe(false)
    expect(expired.canLaunchVr).toBe(false)
    expect(expired.remainingMs).toBe(0)

    const admin = buildEntitlementStanding({
      now: NOW,
      role: 'admin',
      subscriptions: [],
    })
    expect(admin.entitled).toBe(false)
    expect(admin.canLaunchVr).toBe(true)
  })

  it('allows VR while a Free Trial Subscription clock is live', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          plan: FREE_SUBSCRIPTION_PLAN,
          status: 'trialing',
          trialEnd: new Date('2026-08-17T12:00:00.000Z'),
        },
      ],
    })
    expect(standing.entitled).toBe(true)
    expect(standing.canLaunchVr).toBe(true)
    expect(standing.remainingMs).toBeGreaterThan(0)
  })

  it('blocks VR after a Free trial expires while the Free subscription stays active', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          plan: FREE_SUBSCRIPTION_PLAN,
          status: 'active',
          trialEnd: new Date('2026-08-01T12:00:00.000Z'),
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
        },
      ],
    })
    expect(standing.entitled).toBe(false)
    expect(standing.canLaunchVr).toBe(false)
    expect(standing.remainingMs).toBe(0)
    expect(standing.billingPathEstablished).toBe(true)
    expect(standing.checkoutCta).toBe('subscribe')
  })

  it('allows VR while the Entitlement Clock is live', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'trialing',
          trialEnd: new Date('2026-08-17T12:00:00.000Z'),
        },
      ],
    })
    expect(standing.entitled).toBe(true)
    expect(standing.canLaunchVr).toBe(true)
  })

  it('hides Subscribe/Renew CTA while entitled on a paid Pro seat', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
        },
      ],
    })
    expect(standing.entitled).toBe(true)
    expect(standing.checkoutCta).toBeNull()
    expect(standing.billingPathEstablished).toBe(true)
    expect(standing.hadPaidBilling).toBe(true)
  })

  it('shows Subscribe for entitled Free trial seats', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          plan: FREE_SUBSCRIPTION_PLAN,
          status: 'trialing',
          trialEnd: new Date('2026-08-17T12:00:00.000Z'),
        },
      ],
    })
    expect(standing.entitled).toBe(true)
    expect(standing.checkoutCta).toBe('subscribe')
    expect(standing.billingPathEstablished).toBe(true)
  })

  it('shows Subscribe after trial-style history with no paid path', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-08-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
      ],
    })
    expect(standing.entitled).toBe(false)
    expect(standing.checkoutCta).toBe('subscribe')
  })

  it('shows Renew after a previously paid billing Subscription', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-07-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
      ],
    })
    expect(standing.entitled).toBe(false)
    expect(standing.checkoutCta).toBe('renew')
  })

  it('hides Checkout CTA when Billing Path is not established', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [],
    })
    expect(standing.entitled).toBe(false)
    expect(standing.billingPathEstablished).toBe(false)
    expect(standing.checkoutCta).toBeNull()
    expect(standing.billingInterval).toBeNull()
  })

  it('surfaces billingInterval from the picked live Subscription', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          billingInterval: 'year',
        },
      ],
    })
    expect(standing.billingInterval).toBe('year')
  })

  it('marks hasPendingPlanChange when the live Subscription has a Stripe schedule', () => {
    const pending = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: 'pro',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          billingInterval: 'month',
          stripeScheduleId: 'sub_sched_1',
        },
      ],
    })
    expect(pending.hasPendingPlanChange).toBe(true)

    const clear = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: 'pro',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          billingInterval: 'month',
          stripeScheduleId: null,
        },
      ],
    })
    expect(clear.hasPendingPlanChange).toBe(false)
  })

  it('marks cancelAtPeriodEnd when the live Subscription is scheduled to end', () => {
    const pending = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: 'pro',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          billingInterval: 'month',
          cancelAtPeriodEnd: true,
        },
      ],
    })
    expect(pending.cancelAtPeriodEnd).toBe(true)
    expect(pending.entitled).toBe(true)

    const clear = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: 'pro',
          periodEnd: new Date('2026-09-10T12:00:00.000Z'),
          billingInterval: 'month',
          cancelAtPeriodEnd: false,
        },
      ],
    })
    expect(clear.cancelAtPeriodEnd).toBe(false)
  })

  it('keeps soft-expired Subscribe CTA after abandoned Checkout incomplete row', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-08-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
        { status: 'incomplete' },
      ],
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
    expect(standing.canLaunchVr).toBe(false)
    expect(standing.checkoutCta).toBe('subscribe')
    expect(formatRemainingTimeLabel(standing.remainingMs)).toBe('Expired')
  })

  it('keeps soft-expired Renew CTA after abandoned Checkout with paid history', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-07-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
        { status: 'incomplete' },
      ],
    })

    expect(standing.entitled).toBe(false)
    expect(standing.canLaunchVr).toBe(false)
    expect(standing.checkoutCta).toBe('renew')
  })

  it('restores live clock, clears CTAs, and allows VR after Checkout webhook sync', () => {
    const periodEnd = new Date('2026-09-10T12:00:00.000Z')
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-07-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
        {
          status: 'active',
          periodEnd,
        },
      ],
    })

    expect(standing.entitled).toBe(true)
    expect(standing.clockEnd).toEqual(periodEnd)
    expect(standing.remainingMs).toBe(periodEnd.getTime() - NOW.getTime())
    expect(standing.checkoutCta).toBeNull()
    expect(standing.canLaunchVr).toBe(true)
    expect(formatRemainingTimeLabel(standing.remainingMs)).not.toBe('Expired')
  })

  it('never treats Checkout incomplete as an entitled clock before sync', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'incomplete',
          periodEnd: new Date('2026-12-01T12:00:00.000Z'),
        },
      ],
    })

    expect(standing.entitled).toBe(false)
    expect(standing.remainingMs).toBe(0)
    expect(standing.clockEnd).toBeNull()
    expect(standing.canLaunchVr).toBe(false)
  })
})

describe('projectLiveEntitlementStanding', () => {
  it('flips entitled, CTA, and sidebar visibility when the client now crosses clock end', () => {
    const trialEnd = new Date('2026-08-17T12:00:00.000Z')
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          plan: FREE_SUBSCRIPTION_PLAN,
          status: 'trialing',
          trialEnd,
        },
      ],
    })

    const beforeEnd = projectLiveEntitlementStanding({
      standing,
      now: new Date('2026-08-17T11:59:00.000Z'),
      role: 'user',
    })
    expect(beforeEnd.entitled).toBe(true)
    expect(beforeEnd.remainingMs).toBe(60 * 1000)
    expect(beforeEnd.checkoutCta).toBe('subscribe')
    expect(beforeEnd.showRemainingTime).toBe(true)
    expect(beforeEnd.label).toBe(formatRemainingTimeLabel(60 * 1000))
    expect(beforeEnd.checkoutCtaLabel).toBe('Subscribe')

    const afterEnd = projectLiveEntitlementStanding({
      standing,
      now: new Date('2026-08-17T12:00:00.000Z'),
      role: 'user',
    })
    expect(afterEnd.entitled).toBe(false)
    expect(afterEnd.remainingMs).toBe(0)
    expect(afterEnd.checkoutCta).toBe('subscribe')
    expect(afterEnd.showRemainingTime).toBe(false)
    expect(afterEnd.label).toBe('Expired')
    expect(afterEnd.checkoutCtaLabel).toBe('Subscribe')
  })

  it('allows admin and tester VR launch when the live clock is expired', () => {
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'canceled',
          trialEnd: new Date('2026-08-01T12:00:00.000Z'),
          periodEnd: new Date('2026-08-01T12:00:00.000Z'),
        },
      ],
    })

    expect(
      projectLiveEntitlementStanding({
        standing,
        now: NOW,
        role: 'admin',
      }).canLaunchVr,
    ).toBe(true)
    expect(
      projectLiveEntitlementStanding({
        standing,
        now: NOW,
        role: 'tester',
      }).canLaunchVr,
    ).toBe(true)
    expect(
      projectLiveEntitlementStanding({
        standing,
        now: NOW,
        role: 'user',
      }).canLaunchVr,
    ).toBe(false)
  })

  it('defaults safely when standing is nullish and still honors admin VR bypass', () => {
    const empty = projectLiveEntitlementStanding({
      standing: null,
      now: NOW,
      role: 'user',
    })
    expect(empty.remainingMs).toBe(0)
    expect(empty.entitled).toBe(false)
    expect(empty.checkoutCta).toBeNull()
    expect(empty.showRemainingTime).toBe(false)
    expect(empty.label).toBe('Expired')
    expect(empty.checkoutCtaLabel).toBeNull()
    expect(empty.canLaunchVr).toBe(false)

    expect(
      projectLiveEntitlementStanding({
        standing: undefined,
        now: NOW,
        role: 'admin',
      }).canLaunchVr,
    ).toBe(true)
  })

  it('matches Remaining Time and Checkout CTA labels from the existing formatters', () => {
    const periodEnd = new Date('2026-08-12T12:00:00.000Z')
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: PRO_SUBSCRIPTION_PLAN,
          periodEnd,
        },
      ],
    })

    const live = projectLiveEntitlementStanding({
      standing,
      now: NOW,
      role: 'user',
    })
    expect(live.label).toBe(formatRemainingTimeLabel(live.remainingMs))
    expect(live.checkoutCtaLabel).toBe(formatCheckoutCtaLabel(live.checkoutCta))
    expect(live.showRemainingTime).toBe(false)

    const expired = projectLiveEntitlementStanding({
      standing,
      now: periodEnd,
      role: 'user',
    })
    expect(expired.checkoutCta).toBe('renew')
    expect(expired.checkoutCtaLabel).toBe(
      formatCheckoutCtaLabel(expired.checkoutCta),
    )
    expect(expired.label).toBe(formatRemainingTimeLabel(0))
  })

  it('passes through synced flags while overwriting stale time-sensitive fields', () => {
    const periodEnd = new Date('2026-08-20T12:00:00.000Z')
    const standing = buildEntitlementStanding({
      now: NOW,
      role: 'user',
      subscriptions: [
        {
          status: 'active',
          plan: PRO_SUBSCRIPTION_PLAN,
          periodEnd,
          billingInterval: 'year',
          cancelAtPeriodEnd: true,
          stripeScheduleId: 'sub_sched_1',
        },
      ],
    })

    const live = projectLiveEntitlementStanding({
      standing,
      now: NOW,
      role: 'user',
    })
    expect(live.billingPathEstablished).toBe(true)
    expect(live.hadPaidBilling).toBe(true)
    expect(live.billingInterval).toBe('year')
    expect(live.plan).toBe(PRO_SUBSCRIPTION_PLAN)
    expect(live.cancelAtPeriodEnd).toBe(true)
    expect(live.hasPendingPlanChange).toBe(true)
    expect(live.clockEnd).toEqual(periodEnd)
    expect(live.status).toBe('active')
    expect(live.entitled).toBe(true)
    expect(live.checkoutCta).toBeNull()
    expect(live.showRemainingTime).toBe(true)
  })
})

describe('resolveCheckoutCta', () => {
  it('returns null while entitled on a paid Pro seat even with paid history', () => {
    expect(
      resolveCheckoutCta({
        entitled: true,
        billingPathEstablished: true,
        hadPaidBilling: true,
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'active',
      }),
    ).toBeNull()
  })

  it('returns subscribe for entitled Free trial seats', () => {
    expect(
      resolveCheckoutCta({
        entitled: true,
        billingPathEstablished: true,
        hadPaidBilling: false,
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
      }),
    ).toBe('subscribe')
  })

  it('returns null when Billing Path is not established', () => {
    expect(
      resolveCheckoutCta({
        entitled: false,
        billingPathEstablished: false,
        hadPaidBilling: false,
      }),
    ).toBeNull()
  })

  it('returns subscribe when not entitled without paid history', () => {
    expect(
      resolveCheckoutCta({
        entitled: false,
        billingPathEstablished: true,
        hadPaidBilling: false,
      }),
    ).toBe('subscribe')
  })

  it('returns renew when not entitled with paid history', () => {
    expect(
      resolveCheckoutCta({
        entitled: false,
        billingPathEstablished: true,
        hadPaidBilling: true,
      }),
    ).toBe('renew')
  })
})

describe('resolveProfileBillingCheckoutCta', () => {
  it('returns null for entitled paid Pro seats that use the portal', () => {
    expect(
      resolveProfileBillingCheckoutCta({
        entitled: true,
        hasStripeCustomer: true,
        hadPaidBilling: true,
        plan: PRO_SUBSCRIPTION_PLAN,
        status: 'active',
      }),
    ).toBeNull()
  })

  it('allows Subscribe for entitled Free trial seats upgrading to Pro', () => {
    expect(
      resolveProfileBillingCheckoutCta({
        entitled: true,
        hasStripeCustomer: true,
        hadPaidBilling: false,
        plan: FREE_SUBSCRIPTION_PLAN,
        status: 'trialing',
      }),
    ).toBe('subscribe')
  })

  it('allows Subscribe when no Stripe Customer is linked', () => {
    expect(
      resolveProfileBillingCheckoutCta({
        entitled: false,
        hasStripeCustomer: false,
        hadPaidBilling: false,
      }),
    ).toBe('subscribe')
  })

  it('allows Subscribe when a Customer exists without Billing Path', () => {
    expect(
      resolveProfileBillingCheckoutCta({
        entitled: false,
        hasStripeCustomer: true,
        hadPaidBilling: false,
      }),
    ).toBe('subscribe')
  })

  it('returns Renew when a Customer has paid history', () => {
    expect(
      resolveProfileBillingCheckoutCta({
        entitled: false,
        hasStripeCustomer: true,
        hadPaidBilling: true,
      }),
    ).toBe('renew')
  })
})
