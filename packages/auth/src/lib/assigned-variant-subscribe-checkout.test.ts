import { describe, expect, it, vi } from 'vitest'

vi.mock('@virtality/db', () => ({
  prisma: {},
}))

vi.mock('./campaign-window.ts', () => ({
  buildCampaignAwareCheckoutSessionParams: vi.fn(async () => ({
    params: { payment_method_collection: 'always' as const },
  })),
}))

vi.mock('./pending-promotion-code.ts', () => ({
  getOpenPendingPromotionCodeForCheckout: vi.fn(async () => null),
}))

import {
  PRO_PLAN_MONTHLY_PRICE_ID,
  withCheckoutReturnIntent,
} from '@virtality/shared/utils'
import {
  ASSIGNED_VARIANT_CANCEL_STRIPE_SUB_METADATA_KEY,
  startAssignedVariantSubscribeCheckout,
} from './assigned-variant-subscribe-checkout.ts'

const USER_ID = 'user_1'
const CUSTOMER_ID = 'cus_1'
const FREE_SUB_ID = 'sub_free'
const LOCAL_SUB_ID = 'local_sub'
const EARLY_BIRD_MONTHLY = 'price_early_m'
const RETURN_URL = 'https://console.test/user/u1/profile?tab=billing'

function createPrismaMock(input: {
  assignedProVariant?: string | null
  stripeCustomerId?: string | null
  user?: null
  subscription?: {
    id: string
    stripeSubscriptionId: string
    status: string
  } | null
}) {
  return {
    user: {
      findFirst: vi.fn(async () =>
        input.user === null
          ? null
          : {
              id: USER_ID,
              assignedProVariant: input.assignedProVariant ?? 'early-bird',
              stripeCustomerId: input.stripeCustomerId ?? CUSTOMER_ID,
            },
      ),
    },
    subscription: {
      findFirst: vi.fn(async () => input.subscription ?? null),
    },
  }
}

function createStripeMock(input?: {
  assignedMonthlyPriceId?: string
  assignedYearlyPriceId?: string
}) {
  const monthly = input?.assignedMonthlyPriceId ?? EARLY_BIRD_MONTHLY
  const yearly = input?.assignedYearlyPriceId ?? 'price_early_y'

  return {
    prices: {
      list: vi.fn(async () => ({
        data: [
          {
            id: PRO_PLAN_MONTHLY_PRICE_ID,
            lookup_key: 'basic_monthly',
            unit_amount: 15_000,
            currency: 'eur',
            recurring: { interval: 'month' },
            active: true,
            metadata: {},
          },
          {
            id: monthly,
            lookup_key: 'early-bird_monthly',
            unit_amount: 9_900,
            currency: 'eur',
            recurring: { interval: 'month' },
            active: true,
            metadata: {},
          },
          {
            id: yearly,
            lookup_key: 'early-bird_yearly',
            unit_amount: 99_000,
            currency: 'eur',
            recurring: { interval: 'year' },
            active: true,
            metadata: {},
          },
        ],
        has_more: false,
      })),
    },
    checkout: {
      sessions: {
        create: vi.fn(async (params: unknown) => ({
          url: 'https://checkout.stripe.test/session',
          params,
        })),
      },
    },
  }
}

describe('startAssignedVariantSubscribeCheckout', () => {
  it('opens Stripe Checkout with the Assigned Variant monthly Price', async () => {
    const prisma = createPrismaMock({
      subscription: {
        id: LOCAL_SUB_ID,
        stripeSubscriptionId: FREE_SUB_ID,
        status: 'trialing',
      },
    })
    const stripeClient = createStripeMock()

    const result = await startAssignedVariantSubscribeCheckout({
      stripeClient: stripeClient as never,
      prisma: prisma as never,
      referenceId: USER_ID,
      annual: false,
      returnUrl: RETURN_URL,
    })

    expect(result).toEqual({
      ok: true,
      checkoutUrl: 'https://checkout.stripe.test/session',
    })
    expect(stripeClient.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: CUSTOMER_ID,
        mode: 'subscription',
        cancel_url: withCheckoutReturnIntent(RETURN_URL, 'cancel'),
        line_items: [{ price: EARLY_BIRD_MONTHLY, quantity: 1 }],
        payment_method_collection: 'always',
        metadata: expect.objectContaining({
          userId: USER_ID,
          subscriptionId: LOCAL_SUB_ID,
          referenceId: USER_ID,
          [ASSIGNED_VARIANT_CANCEL_STRIPE_SUB_METADATA_KEY]: FREE_SUB_ID,
        }),
        subscription_data: {
          metadata: expect.objectContaining({
            [ASSIGNED_VARIANT_CANCEL_STRIPE_SUB_METADATA_KEY]: FREE_SUB_ID,
          }),
        },
      }),
    )
  })

  it('requires a live Free subscription', async () => {
    const prisma = createPrismaMock({ subscription: null })
    const stripeClient = createStripeMock()

    const result = await startAssignedVariantSubscribeCheckout({
      stripeClient: stripeClient as never,
      prisma: prisma as never,
      referenceId: USER_ID,
      annual: false,
      returnUrl: RETURN_URL,
    })

    expect(result).toEqual({
      ok: false,
      message: 'Subscribe requires a live Free subscription.',
    })
    expect(stripeClient.checkout.sessions.create).not.toHaveBeenCalled()
  })
})
