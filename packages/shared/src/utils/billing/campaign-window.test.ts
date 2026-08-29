import { describe, expect, it } from 'vitest'
import {
  PRO_PLAN_PRODUCT_ID,
  type CouponLibraryRecord,
} from './coupon-library.ts'
import {
  assessCampaignCouponHealth,
  closeCampaignWindow,
  isCampaignWindowAttaching,
  listCouponsForCampaignPicker,
  resolveCampaignCheckoutCouponId,
  resolveCampaignWindowLifecycle,
  toCampaignCheckoutSessionParams,
  upsertCampaignWindow,
  type CampaignWindowRecord,
  type CampaignWindowStore,
} from './campaign-window.ts'

function baseCoupon(
  overrides: Partial<CouponLibraryRecord> = {},
): CouponLibraryRecord {
  return {
    id: 'cou_campaign',
    name: 'Launch',
    percentOff: 20,
    amountOff: null,
    currency: null,
    duration: 'once',
    durationInMonths: null,
    appliesToProductIds: [PRO_PLAN_PRODUCT_ID],
    archived: false,
    created: 1_700_000_000,
    ...overrides,
  }
}

function baseWindow(
  overrides: Partial<CampaignWindowRecord> = {},
): CampaignWindowRecord {
  return {
    id: 'singleton',
    couponId: 'cou_campaign',
    startsAt: new Date('2026-08-01T00:00:00.000Z'),
    endsAt: new Date('2026-08-31T00:00:00.000Z'),
    closedAt: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  }
}

function createStore(
  initial: CampaignWindowRecord | null = null,
): CampaignWindowStore & { row: CampaignWindowRecord | null } {
  const store = {
    row: initial,
    get: async () => store.row,
    save: async (record: CampaignWindowRecord) => {
      store.row = record
      return record
    },
  }
  return store
}

describe('resolveCampaignWindowLifecycle', () => {
  const now = new Date('2026-08-17T12:00:00.000Z')

  it('reports none when no window exists', () => {
    expect(resolveCampaignWindowLifecycle(null, now)).toBe('none')
  })

  it('reports scheduled before startsAt', () => {
    expect(
      resolveCampaignWindowLifecycle(
        baseWindow({
          startsAt: new Date('2026-08-20T00:00:00.000Z'),
          endsAt: new Date('2026-09-01T00:00:00.000Z'),
        }),
        now,
      ),
    ).toBe('scheduled')
  })

  it('reports live while inside the open window', () => {
    expect(resolveCampaignWindowLifecycle(baseWindow(), now)).toBe('live')
  })

  it('reports ended after endsAt when not closed', () => {
    expect(
      resolveCampaignWindowLifecycle(
        baseWindow({ endsAt: new Date('2026-08-10T00:00:00.000Z') }),
        now,
      ),
    ).toBe('ended')
  })

  it('reports closed when closedAt is set', () => {
    expect(
      resolveCampaignWindowLifecycle(
        baseWindow({ closedAt: new Date('2026-08-15T00:00:00.000Z') }),
        now,
      ),
    ).toBe('closed')
  })
})

describe('isCampaignWindowAttaching', () => {
  const now = new Date('2026-08-17T12:00:00.000Z')

  it('is true only while the window is live', () => {
    expect(isCampaignWindowAttaching(baseWindow(), now)).toBe(true)
    expect(
      isCampaignWindowAttaching(
        baseWindow({ startsAt: new Date('2026-08-20T00:00:00.000Z') }),
        now,
      ),
    ).toBe(false)
    expect(
      isCampaignWindowAttaching(
        baseWindow({ closedAt: new Date('2026-08-16T00:00:00.000Z') }),
        now,
      ),
    ).toBe(false)
  })
})

describe('assessCampaignCouponHealth', () => {
  it('marks missing Coupons deleted', () => {
    expect(assessCampaignCouponHealth(null)).toBe('deleted')
  })

  it('marks archived Coupons archived', () => {
    expect(assessCampaignCouponHealth(baseCoupon({ archived: true }))).toBe(
      'archived',
    )
  })

  it('marks Coupons that omit Pro applies_to', () => {
    expect(
      assessCampaignCouponHealth(baseCoupon({ appliesToProductIds: [] })),
    ).toBe('applies_to_miss')
  })

  it('marks Pro Coupons healthy', () => {
    expect(assessCampaignCouponHealth(baseCoupon())).toBe('healthy')
  })
})

describe('resolveCampaignCheckoutCouponId', () => {
  const now = new Date('2026-08-17T12:00:00.000Z')

  it('attaches the live healthy Coupon for Subscribe (!hadPaidBilling)', () => {
    expect(
      resolveCampaignCheckoutCouponId({
        window: baseWindow(),
        couponHealth: 'healthy',
        hadPaidBilling: false,
        now,
      }),
    ).toBe('cou_campaign')
  })

  it('omits attach for Renew (hadPaidBilling)', () => {
    expect(
      resolveCampaignCheckoutCouponId({
        window: baseWindow(),
        couponHealth: 'healthy',
        hadPaidBilling: true,
        now,
      }),
    ).toBeNull()
  })

  it('omits attach when the Coupon is unhealthy without blocking', () => {
    expect(
      resolveCampaignCheckoutCouponId({
        window: baseWindow(),
        couponHealth: 'archived',
        hadPaidBilling: false,
        now,
      }),
    ).toBeNull()
    expect(
      resolveCampaignCheckoutCouponId({
        window: baseWindow(),
        couponHealth: 'deleted',
        hadPaidBilling: false,
        now,
      }),
    ).toBeNull()
    expect(
      resolveCampaignCheckoutCouponId({
        window: baseWindow(),
        couponHealth: 'applies_to_miss',
        hadPaidBilling: false,
        now,
      }),
    ).toBeNull()
  })

  it('omits attach when the window is closed or not yet live', () => {
    expect(
      resolveCampaignCheckoutCouponId({
        window: baseWindow({ closedAt: new Date('2026-08-16T00:00:00.000Z') }),
        couponHealth: 'healthy',
        hadPaidBilling: false,
        now,
      }),
    ).toBeNull()
    expect(
      resolveCampaignCheckoutCouponId({
        window: null,
        couponHealth: 'healthy',
        hadPaidBilling: false,
        now,
      }),
    ).toBeNull()
  })

  it('builds Checkout params with discounts and without allow_promotion_codes', () => {
    const withDiscount = toCampaignCheckoutSessionParams('cou_campaign')
    expect(withDiscount).toEqual({
      payment_method_collection: 'always',
      discounts: [{ coupon: 'cou_campaign' }],
    })
    expect(withDiscount).not.toHaveProperty('allow_promotion_codes')

    expect(toCampaignCheckoutSessionParams(null)).toEqual({
      payment_method_collection: 'always',
    })
  })
})

describe('listCouponsForCampaignPicker', () => {
  it('returns only non-archived Coupons that apply to Pro', () => {
    const coupons = [
      baseCoupon({ id: 'cou_ok' }),
      baseCoupon({ id: 'cou_archived', archived: true }),
      baseCoupon({ id: 'cou_miss', appliesToProductIds: [] }),
    ]
    expect(listCouponsForCampaignPicker(coupons).map((c) => c.id)).toEqual([
      'cou_ok',
    ])
  })
})

describe('upsertCampaignWindow', () => {
  it('creates a window and reports the Coupon id for registry', async () => {
    const store = createStore()
    const registered: string[] = []

    const result = await upsertCampaignWindow(
      store,
      {
        couponId: 'cou_new',
        startsAt: new Date('2026-08-20T00:00:00.000Z'),
        endsAt: new Date('2026-09-01T00:00:00.000Z'),
      },
      {
        now: () => new Date('2026-08-17T12:00:00.000Z'),
        onCouponSelected: async (couponId) => {
          registered.push(couponId)
        },
      },
    )

    expect(result.couponId).toBe('cou_new')
    expect(result.closedAt).toBeNull()
    expect(registered).toEqual(['cou_new'])
    expect(store.row?.couponId).toBe('cou_new')
  })

  it('swaps the Coupon mid-window and keeps closedAt cleared', async () => {
    const store = createStore(baseWindow())
    const registered: string[] = []

    const result = await upsertCampaignWindow(
      store,
      {
        couponId: 'cou_swap',
        startsAt: new Date('2026-08-01T00:00:00.000Z'),
        endsAt: new Date('2026-08-31T00:00:00.000Z'),
      },
      {
        now: () => new Date('2026-08-17T12:00:00.000Z'),
        onCouponSelected: async (couponId) => {
          registered.push(couponId)
        },
      },
    )

    expect(result.couponId).toBe('cou_swap')
    expect(result.closedAt).toBeNull()
    expect(registered).toEqual(['cou_swap'])
  })

  it('rejects when endsAt is not after startsAt', async () => {
    const store = createStore()
    await expect(
      upsertCampaignWindow(store, {
        couponId: 'cou_new',
        startsAt: new Date('2026-08-20T00:00:00.000Z'),
        endsAt: new Date('2026-08-20T00:00:00.000Z'),
      }),
    ).rejects.toThrow(/endsAt/)
  })
})

describe('closeCampaignWindow', () => {
  it('sets closedAt and stops new attaches', async () => {
    const store = createStore(baseWindow())
    const closedAt = new Date('2026-08-17T12:00:00.000Z')

    const result = await closeCampaignWindow(store, {
      now: () => closedAt,
    })

    expect(result?.closedAt).toEqual(closedAt)
    expect(isCampaignWindowAttaching(result, closedAt)).toBe(false)
  })
})
