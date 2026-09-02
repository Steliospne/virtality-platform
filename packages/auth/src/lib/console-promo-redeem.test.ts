import { describe, expect, it, vi } from 'vitest'

vi.mock('@virtality/db', () => ({
  prisma: {},
}))

import {
  redeemPromotionCodeForUser,
  removePromoDiscountForUser,
  resolvePromotionCodeForNewCheckout,
} from './console-promo-redeem.ts'

const USER_ID = 'user_1'
const LIVE_SUB_ID = 'sub_live'

function createStripeMock() {
  return {
    subscriptions: {
      retrieve: vi.fn(async () => ({
        discounts: [
          {
            id: 'di_1',
            start: 1000,
            end: null,
            promotion_code: { id: 'promo_1', code: 'SAVE30' },
            coupon: {
              id: 'coup_1',
              name: 'Save 30',
              percent_off: null,
              amount_off: 2500,
              currency: 'eur',
              duration: 'once',
              duration_in_months: null,
            },
          },
        ],
        items: { data: [] },
      })),
      update: vi.fn(async () => ({})),
      deleteDiscount: vi.fn(async () => ({})),
    },
    promotionCodes: {
      list: vi.fn(async () => ({
        data: [
          {
            id: 'promo_1',
            code: 'SAVE30',
            active: true,
            expires_at: null,
            max_redemptions: null,
            times_redeemed: 1,
            coupon: 'coup_1',
          },
        ],
      })),
    },
    coupons: {
      retrieve: vi.fn(async () => ({
        id: 'coup_1',
        name: 'Save 30',
        percent_off: null,
        amount_off: 2500,
        currency: 'eur',
        duration: 'once',
        duration_in_months: null,
        applies_to: { products: [] },
        metadata: {},
      })),
    },
  }
}

function createPrismaMock(input: {
  subscription?: { stripeSubscriptionId: string; status: string; plan: string } | null
  pendingHold?: {
    id: string
    userId: string
    code: string
    promotionCodeId: string
    couponId: string
    expiresAt: Date
  } | null
}) {
  return {
    subscription: {
      findFirst: vi.fn(async () => input.subscription ?? null),
    },
    pendingPromotionCode: {
      findFirst: vi.fn(async () => input.pendingHold ?? null),
      findMany: vi.fn(async () => []),
      updateMany: vi.fn(async () => ({ count: 0 })),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'hold_new',
        ...args.data,
      })),
    },
  }
}

describe('resolvePromotionCodeForNewCheckout', () => {
  it('uses an existing open pending hold without touching the live Subscription', async () => {
    const prisma = createPrismaMock({
      pendingHold: {
        id: 'hold_1',
        userId: USER_ID,
        code: 'SAVE30',
        promotionCodeId: 'promo_hold',
        couponId: 'coup_1',
        expiresAt: new Date(Date.now() + 60_000),
      },
    })
    const stripeClient = createStripeMock()

    const result = await resolvePromotionCodeForNewCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(result).toEqual({ promotionCodeId: 'promo_hold' })
    expect(stripeClient.subscriptions.retrieve).not.toHaveBeenCalled()
  })

  it('mirrors a live promo Discount into a fresh hold when there is no pending hold', async () => {
    const prisma = createPrismaMock({
      subscription: {
        stripeSubscriptionId: LIVE_SUB_ID,
        status: 'active',
        plan: 'pro',
      },
      pendingHold: null,
    })
    const stripeClient = createStripeMock()

    const result = await resolvePromotionCodeForNewCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(result).toEqual({ promotionCodeId: 'promo_1' })
    expect(prisma.pendingPromotionCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          code: 'SAVE30',
          promotionCodeId: 'promo_1',
        }),
      }),
    )
  })

  it('returns null when there is no pending hold and no live promo Discount', async () => {
    const prisma = createPrismaMock({ subscription: null, pendingHold: null })
    const stripeClient = createStripeMock()

    const result = await resolvePromotionCodeForNewCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(result).toBeNull()
  })
})

describe('redeemPromotionCodeForUser', () => {
  it('arms a fresh TTL hold tied to the live Subscription after a successful redeem', async () => {
    const prisma = createPrismaMock({
      subscription: {
        stripeSubscriptionId: LIVE_SUB_ID,
        status: 'active',
        plan: 'pro',
      },
    })
    const stripeClient = createStripeMock()
    stripeClient.subscriptions.retrieve = vi.fn(async () => ({
      discounts: [],
      items: { data: [] },
    }))

    await redeemPromotionCodeForUser(
      { userId: USER_ID, code: 'SAVE30', confirmReplace: false },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(stripeClient.subscriptions.update).toHaveBeenCalledWith(
      LIVE_SUB_ID,
      expect.objectContaining({
        discounts: [{ promotion_code: 'promo_1' }],
      }),
    )
    expect(prisma.pendingPromotionCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          promotionCodeId: 'promo_1',
          liveSubscriptionId: LIVE_SUB_ID,
        }),
      }),
    )
  })
})

describe('removePromoDiscountForUser', () => {
  it('clears the live Subscription Discount and cancels any open pending hold', async () => {
    const prisma = createPrismaMock({
      subscription: {
        stripeSubscriptionId: LIVE_SUB_ID,
        status: 'active',
        plan: 'pro',
      },
      pendingHold: null,
    })
    const stripeClient = createStripeMock()

    await removePromoDiscountForUser(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(stripeClient.subscriptions.deleteDiscount).toHaveBeenCalledWith(
      LIVE_SUB_ID,
    )
    expect(prisma.pendingPromotionCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID, status: 'open' }),
        data: expect.objectContaining({ status: 'canceled' }),
      }),
    )
  })
})
