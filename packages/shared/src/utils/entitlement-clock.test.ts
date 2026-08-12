import { describe, expect, it } from 'vitest'
import {
  buildEntitlementStanding,
  canLaunchVrPrograms,
  formatEntitlementClockEndLabel,
  formatRemainingTimeLabel,
  hadPaidBillingHistory,
  pickEntitlementSubscription,
  remainingMsFromClockEnd,
  resolveCheckoutCta,
  resolveProfileBillingCheckoutCta,
  resolveEntitlementClock,
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

  it('hides Subscribe/Renew CTA while entitled', () => {
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
})

describe('resolveCheckoutCta', () => {
  it('returns null while entitled even with paid history', () => {
    expect(
      resolveCheckoutCta({
        entitled: true,
        billingPathEstablished: true,
        hadPaidBilling: true,
      }),
    ).toBeNull()
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
  it('returns null while entitled even with a Stripe Customer', () => {
    expect(
      resolveProfileBillingCheckoutCta({
        entitled: true,
        hasStripeCustomer: true,
        hadPaidBilling: false,
      }),
    ).toBeNull()
  })

  it('returns null without a Stripe Customer', () => {
    expect(
      resolveProfileBillingCheckoutCta({
        entitled: false,
        hasStripeCustomer: false,
        hadPaidBilling: false,
      }),
    ).toBeNull()
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
