import { describe, expect, it, vi } from 'vitest'

vi.mock('@virtality/db', () => ({
  prisma: {},
}))

import {
  armLivePromotionCodeHold,
  cancelPendingPromotionCodeForCheckout,
  getOpenPendingPromotionCodeForCheckout,
} from './pending-promotion-code.ts'

const USER_ID = 'user_1'
const LIVE_SUB_ID = 'sub_live'

function createPrismaMock(input: {
  due?: Array<{ id: string; liveSubscriptionId: string | null }>
  open?: Array<{ id: string; liveSubscriptionId: string | null }>
  openRow?: {
    id: string
    userId: string
    code: string
    promotionCodeId: string
    couponId: string
    liveSubscriptionId: string | null
    expiresAt: Date
  } | null
}) {
  return {
    pendingPromotionCode: {
      findMany: vi.fn(
        async (args: {
          where: { expiresAt?: { lte?: unknown; gt?: unknown } }
        }) =>
          args.where.expiresAt && 'lte' in args.where.expiresAt
            ? (input.due ?? [])
            : (input.open ?? []),
      ),
      findFirst: vi.fn(async () => input.openRow ?? null),
      updateMany: vi.fn(async () => ({ count: 1 })),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'hold_new',
        ...args.data,
      })),
    },
  }
}

function createStripeMock() {
  return {
    subscriptions: {
      deleteDiscount: vi.fn(async () => ({})),
    },
  }
}

describe('sweep on getOpenPendingPromotionCodeForCheckout', () => {
  it('reverts the live Discount for an expired hold before reading', async () => {
    const prisma = createPrismaMock({
      due: [{ id: 'hold_expired', liveSubscriptionId: LIVE_SUB_ID }],
    })
    const stripeClient = createStripeMock()

    await getOpenPendingPromotionCodeForCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(stripeClient.subscriptions.deleteDiscount).toHaveBeenCalledWith(
      LIVE_SUB_ID,
    )
    expect(prisma.pendingPromotionCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['hold_expired'] } },
        data: expect.objectContaining({ status: 'expired' }),
      }),
    )
  })

  it('leaves the hold open when the Stripe revert fails (retry next sweep)', async () => {
    const prisma = createPrismaMock({
      due: [{ id: 'hold_expired', liveSubscriptionId: LIVE_SUB_ID }],
    })
    const stripeClient = createStripeMock()
    stripeClient.subscriptions.deleteDiscount = vi.fn(async () => {
      throw new Error('network error')
    })

    await getOpenPendingPromotionCodeForCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(prisma.pendingPromotionCode.updateMany).not.toHaveBeenCalled()
  })

  it('does not call Stripe for a plain pre-Checkout hold (no liveSubscriptionId)', async () => {
    const prisma = createPrismaMock({
      due: [{ id: 'hold_expired', liveSubscriptionId: null }],
    })
    const stripeClient = createStripeMock()

    await getOpenPendingPromotionCodeForCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(stripeClient.subscriptions.deleteDiscount).not.toHaveBeenCalled()
    expect(prisma.pendingPromotionCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['hold_expired'] } },
      }),
    )
  })
})

describe('cancelPendingPromotionCodeForCheckout', () => {
  it('reverts the live Discount when canceling a hold that tracks one', async () => {
    const prisma = createPrismaMock({
      open: [{ id: 'hold_1', liveSubscriptionId: LIVE_SUB_ID }],
    })
    const stripeClient = createStripeMock()

    const count = await cancelPendingPromotionCodeForCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(count).toBe(1)
    expect(stripeClient.subscriptions.deleteDiscount).toHaveBeenCalledWith(
      LIVE_SUB_ID,
    )
  })

  it('does not call Stripe for a plain pre-Checkout hold', async () => {
    const prisma = createPrismaMock({
      open: [{ id: 'hold_1', liveSubscriptionId: null }],
    })
    const stripeClient = createStripeMock()

    await cancelPendingPromotionCodeForCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(stripeClient.subscriptions.deleteDiscount).not.toHaveBeenCalled()
  })
})

describe('armLivePromotionCodeHold', () => {
  it('creates a hold row tagged with the live Subscription id', async () => {
    const prisma = createPrismaMock({})

    await armLivePromotionCodeHold(
      {
        userId: USER_ID,
        code: 'SAVE30',
        promotionCodeId: 'promo_1',
        couponId: 'coup_1',
        liveSubscriptionId: LIVE_SUB_ID,
      },
      { prisma: prisma as never },
    )

    expect(prisma.pendingPromotionCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          code: 'SAVE30',
          promotionCodeId: 'promo_1',
          liveSubscriptionId: LIVE_SUB_ID,
        }),
      }),
    )
  })
})
