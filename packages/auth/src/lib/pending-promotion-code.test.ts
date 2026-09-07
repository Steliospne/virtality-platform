import { describe, expect, it, vi } from 'vitest'

vi.mock('@virtality/db', () => ({
  prisma: {},
}))

import {
  cancelPendingPromotionCodeForCheckout,
  getOpenPendingPromotionCodeForCheckout,
} from './pending-promotion-code.ts'

const USER_ID = 'user_1'
const LIVE_SUB_ID = 'sub_live'

function createPrismaMock(input: {
  openRow?: {
    id: string
    userId: string
    code: string
    promotionCodeId: string
    couponId: string
    liveSubscriptionId: string | null
    expiresAt: Date
  } | null
  open?: Array<{ id: string; liveSubscriptionId: string | null }>
}) {
  return {
    pendingPromotionCode: {
      findMany: vi.fn(async () => input.open ?? []),
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

describe('getOpenPendingPromotionCodeForCheckout', () => {
  it('returns the open hold without touching Stripe', async () => {
    const openRow = {
      id: 'hold_1',
      userId: USER_ID,
      code: 'SAVE30',
      promotionCodeId: 'promo_1',
      couponId: 'coup_1',
      liveSubscriptionId: null,
      expiresAt: new Date(),
    }
    const prisma = createPrismaMock({ openRow })
    const stripeClient = createStripeMock()

    const result = await getOpenPendingPromotionCodeForCheckout(
      { userId: USER_ID },
      { prisma: prisma as never, stripeClient: stripeClient as never },
    )

    expect(result).toEqual(openRow)
    expect(stripeClient.subscriptions.deleteDiscount).not.toHaveBeenCalled()
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
