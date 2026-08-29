import { describe, expect, it, vi } from 'vitest'

vi.mock('@virtality/db', () => ({
  prisma: {},
}))

import {
  FREE_PLAN_PRICE_ID,
  FREE_SUBSCRIPTION_PLAN,
  PRO_PLAN_MONTHLY_PRICE_ID,
  toAbsoluteConsoleReturnUrl,
} from '@virtality/shared/utils'
import { startAssignedVariantSubscribeCheckout } from './assigned-variant-subscribe-checkout.ts'

const USER_ID = 'user_1'
const CUSTOMER_ID = 'cus_1'
const FREE_SUB_ID = 'sub_free'
const FREE_ITEM_ID = 'si_free'
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
    subscriptions: {
      retrieve: vi.fn(async () => ({
        id: FREE_SUB_ID,
        items: {
          data: [
            {
              id: FREE_ITEM_ID,
              price: { id: FREE_PLAN_PRICE_ID },
            },
          ],
        },
      })),
    },
    billingPortal: {
      sessions: {
        create: vi.fn(async (params: unknown) => ({
          url: 'https://billing.stripe.test/session',
          params,
        })),
      },
    },
  }
}

describe('startAssignedVariantSubscribeCheckout', () => {
  it('opens billing portal with the Assigned Variant monthly Price', async () => {
    const prisma = createPrismaMock({
      subscription: {
        id: 'local_sub',
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
      checkoutUrl: 'https://billing.stripe.test/session',
    })
    expect(stripeClient.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: CUSTOMER_ID,
        return_url: toAbsoluteConsoleReturnUrl(RETURN_URL),
        flow_data: expect.objectContaining({
          type: 'subscription_update_confirm',
          subscription_update_confirm: {
            subscription: FREE_SUB_ID,
            items: [
              {
                id: FREE_ITEM_ID,
                price: EARLY_BIRD_MONTHLY,
                quantity: 1,
              },
            ],
          },
        }),
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
    expect(stripeClient.billingPortal.sessions.create).not.toHaveBeenCalled()
  })
})
