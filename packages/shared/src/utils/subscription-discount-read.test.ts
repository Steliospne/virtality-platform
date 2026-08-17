import { describe, expect, it, vi } from 'vitest'
import {
  applyCouponMinor,
  classifySubscriptionDiscount,
  readSubscriptionDiscount,
  shouldBillingSoftUnavailable,
  type CampaignRegistry,
  type SubscriptionDiscountStripeGateway,
  type SubscriptionDiscountStripeSnapshot,
} from './subscription-discount-read.ts'

function coupon(
  overrides: Partial<
    SubscriptionDiscountStripeSnapshot['discounts'][number]['coupon']
  > = {},
): SubscriptionDiscountStripeSnapshot['discounts'][number]['coupon'] {
  return {
    id: 'coupon_staff_1',
    name: 'Staff deal',
    percent_off: 20,
    amount_off: null,
    currency: null,
    duration: 'forever',
    duration_in_months: null,
    ...overrides,
  }
}

function discount(
  overrides: Partial<
    SubscriptionDiscountStripeSnapshot['discounts'][number]
  > = {},
): SubscriptionDiscountStripeSnapshot['discounts'][number] {
  return {
    id: 'di_1',
    start: 1_700_000_000,
    end: null,
    promotion_code: null,
    coupon: coupon(),
    ...overrides,
  }
}

function snapshot(
  overrides: Partial<{
    discounts: SubscriptionDiscountStripeSnapshot['discounts']
    items: SubscriptionDiscountStripeSnapshot['items']
  }> = {},
): SubscriptionDiscountStripeSnapshot {
  return {
    discounts: [],
    items: { data: [{ discounts: [] }] },
    ...overrides,
  }
}

function registry(
  campaignIds:
    | ReadonlySet<string>
    | ((id: string) => Promise<boolean>) = new Set(),
): CampaignRegistry {
  if (typeof campaignIds === 'function') {
    return { isCampaignCouponId: campaignIds }
  }
  return {
    isCampaignCouponId: async (couponId) => campaignIds.has(couponId),
  }
}

function gateway(
  result:
    | { ok: true; subscription: SubscriptionDiscountStripeSnapshot }
    | { ok: false; reason: 'subscription_missing' | 'stripe_unavailable' },
): SubscriptionDiscountStripeGateway {
  return {
    retrieveSubscriptionWithDiscounts: vi.fn(async () => result),
  }
}

describe('classifySubscriptionDiscount', () => {
  it('returns presence none when Subscription discounts are empty', async () => {
    const result = await classifySubscriptionDiscount(
      snapshot({ discounts: [] }),
      registry(),
    )
    expect(result).toEqual({ ok: true, presence: 'none' })
  })

  it('returns presence none when discounts is null', async () => {
    const result = await classifySubscriptionDiscount(
      snapshot({ discounts: null }),
      registry(),
    )
    expect(result).toEqual({ ok: true, presence: 'none' })
  })

  it('fails closed on stacked Subscription Discounts', async () => {
    const result = await classifySubscriptionDiscount(
      snapshot({
        discounts: [discount({ id: 'di_1' }), discount({ id: 'di_2' })],
      }),
      registry(),
    )
    expect(result).toEqual({ ok: false, reason: 'stacked_or_unsupported' })
  })

  it('fails closed when any Subscription item has Discounts', async () => {
    const result = await classifySubscriptionDiscount(
      snapshot({
        discounts: [discount()],
        items: { data: [{ discounts: ['di_item'] }] },
      }),
      registry(),
    )
    expect(result).toEqual({ ok: false, reason: 'stacked_or_unsupported' })
  })

  it('classifies promo when Discount has a Promotion Code (wins over registry)', async () => {
    const result = await classifySubscriptionDiscount(
      snapshot({
        discounts: [
          discount({
            promotion_code: { id: 'promo_1', code: 'SAVE20' },
            coupon: coupon({ id: 'coupon_also_campaign' }),
          }),
        ],
      }),
      registry(new Set(['coupon_also_campaign'])),
    )
    expect(result).toMatchObject({
      ok: true,
      presence: 'one',
      channel: 'promo',
      couponId: 'coupon_also_campaign',
      promotionCodeId: 'promo_1',
      promotionCode: 'SAVE20',
      percentOff: 20,
    })
  })

  it('classifies campaign when Coupon id is in the Campaign registry', async () => {
    const result = await classifySubscriptionDiscount(
      snapshot({
        discounts: [
          discount({
            coupon: coupon({
              id: 'coupon_campaign',
              name: 'Launch',
              percent_off: null,
              amount_off: 3000,
              currency: 'eur',
              duration: 'repeating',
              duration_in_months: 3,
            }),
          }),
        ],
      }),
      registry(new Set(['coupon_campaign'])),
    )
    expect(result).toEqual({
      ok: true,
      presence: 'one',
      channel: 'campaign',
      discountId: 'di_1',
      couponId: 'coupon_campaign',
      couponName: 'Launch',
      promotionCodeId: null,
      promotionCode: null,
      start: 1_700_000_000,
      end: null,
      percentOff: null,
      amountOff: 3000,
      currency: 'eur',
      duration: 'repeating',
      durationInMonths: 3,
    })
  })

  it('classifies staff when Coupon is not promo and not in registry', async () => {
    const result = await classifySubscriptionDiscount(
      snapshot({ discounts: [discount()] }),
      registry(),
    )
    expect(result).toMatchObject({
      ok: true,
      presence: 'one',
      channel: 'staff',
      couponId: 'coupon_staff_1',
      promotionCodeId: null,
    })
  })

  it('fails closed when registry is unavailable for a non-promo Discount', async () => {
    const result = await classifySubscriptionDiscount(
      snapshot({ discounts: [discount()] }),
      registry(async () => {
        throw new Error('db down')
      }),
    )
    expect(result).toEqual({ ok: false, reason: 'registry_unavailable' })
  })
})

describe('readSubscriptionDiscount', () => {
  it('fails when local stripeSubscriptionId is missing', async () => {
    const result = await readSubscriptionDiscount(
      { stripeSubscriptionId: null },
      gateway({ ok: true, subscription: snapshot() }),
      registry(),
    )
    expect(result).toEqual({ ok: false, reason: 'subscription_missing' })
  })

  it('maps Stripe retrieve failures without inventing a channel', async () => {
    const missing = await readSubscriptionDiscount(
      { stripeSubscriptionId: 'sub_x' },
      gateway({ ok: false, reason: 'subscription_missing' }),
      registry(),
    )
    expect(missing).toEqual({ ok: false, reason: 'subscription_missing' })

    const unavailable = await readSubscriptionDiscount(
      { stripeSubscriptionId: 'sub_x' },
      gateway({ ok: false, reason: 'stripe_unavailable' }),
      registry(),
    )
    expect(unavailable).toEqual({ ok: false, reason: 'stripe_unavailable' })
  })

  it('maps thrown Stripe errors to stripe_unavailable', async () => {
    const throwing: SubscriptionDiscountStripeGateway = {
      retrieveSubscriptionWithDiscounts: async () => {
        throw new Error('network')
      },
    }
    const result = await readSubscriptionDiscount(
      { stripeSubscriptionId: 'sub_x' },
      throwing,
      registry(),
    )
    expect(result).toEqual({ ok: false, reason: 'stripe_unavailable' })
  })

  it('returns classified presence one from a successful retrieve', async () => {
    const result = await readSubscriptionDiscount(
      { stripeSubscriptionId: 'sub_live' },
      gateway({
        ok: true,
        subscription: snapshot({ discounts: [discount()] }),
      }),
      registry(),
    )
    expect(result).toMatchObject({
      ok: true,
      presence: 'one',
      channel: 'staff',
      discountId: 'di_1',
    })
  })
})

describe('shouldBillingSoftUnavailable', () => {
  it('is soft-unavailable on read failure and incomplete amount-off terms', async () => {
    expect(
      shouldBillingSoftUnavailable({
        ok: false,
        reason: 'stripe_unavailable',
      }),
    ).toBe(true)
    expect(shouldBillingSoftUnavailable({ ok: true, presence: 'none' })).toBe(
      false,
    )

    const one = await classifySubscriptionDiscount(
      snapshot({
        discounts: [
          discount({
            coupon: coupon({
              percent_off: null,
              amount_off: 1000,
              currency: 'usd',
            }),
          }),
        ],
      }),
      registry(),
    )
    expect(shouldBillingSoftUnavailable(one)).toBe(true)
  })
})

describe('applyCouponMinor', () => {
  it('applies percent-off and amount-off against catalog minor units', () => {
    expect(applyCouponMinor(15000, { percentOff: 20, amountOff: null })).toBe(
      12000,
    )
    expect(applyCouponMinor(15000, { percentOff: null, amountOff: 3000 })).toBe(
      12000,
    )
    expect(applyCouponMinor(2000, { percentOff: null, amountOff: 5000 })).toBe(
      0,
    )
  })
})
