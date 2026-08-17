import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  CONSOLE_PROMO_ELIGIBLE_STATUSES,
  PRO_PLAN_PRODUCT_ID,
  isConsolePromoEligibleStatus,
  loadConsolePromoRedeemPreflight,
  redeemPromotionCodeOnSubscription,
  removePromoDiscountFromSubscription,
  type ConsolePromoEligibleStatus,
  type ConsolePromoReadGateway,
  type ConsolePromoStore,
  type ConsolePromoStripeGateway,
  type PromotionCodeLookup,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { retrieveLibraryCoupon } from './coupon-library.ts'
import { readLiveSubscriptionDiscount } from './subscription-discount-read.ts'

type ConsolePromoDeps = {
  prisma?: PrismaClient
  stripeClient: Stripe
}

type ConsolePromoRuntime = {
  client: PrismaClient
  store: ConsolePromoStore
  stripe: ConsolePromoStripeGateway
  read: ConsolePromoReadGateway
}

function productIdsForPlan(plan: string): string[] {
  if (plan === 'pro' || plan.trim() === '') {
    return [PRO_PLAN_PRODUCT_ID]
  }
  return []
}

function couponIdFromPromotionCode(
  promotionCode: Stripe.PromotionCode,
): string {
  const coupon = promotionCode.coupon
  if (typeof coupon === 'string') return coupon
  return coupon.id
}

function mapPromotionCodeLookup(
  promotionCode: Stripe.PromotionCode,
): PromotionCodeLookup {
  return {
    id: promotionCode.id,
    code: promotionCode.code,
    couponId: couponIdFromPromotionCode(promotionCode),
    active: promotionCode.active,
    expiresAt: promotionCode.expires_at,
    maxRedemptions: promotionCode.max_redemptions,
    timesRedeemed: promotionCode.times_redeemed,
  }
}

function createConsolePromoRuntime(
  deps: ConsolePromoDeps,
): ConsolePromoRuntime {
  const client = deps.prisma ?? prisma
  return {
    client,
    store: createPrismaConsolePromoStore(client),
    stripe: createStripeConsolePromoGateway(deps.stripeClient),
    read: createConsolePromoReadGateway(deps.stripeClient, client),
  }
}

export function createPrismaConsolePromoStore(
  client: PrismaClient = prisma,
): ConsolePromoStore {
  return {
    findEligibleSubscriptionByUserId: async (userId) => {
      const row = await client.subscription.findFirst({
        where: {
          referenceId: userId,
          status: { in: [...CONSOLE_PROMO_ELIGIBLE_STATUSES] },
          stripeSubscriptionId: { not: null },
        },
        orderBy: { id: 'desc' },
        select: {
          stripeSubscriptionId: true,
          status: true,
          plan: true,
        },
      })
      if (!row?.stripeSubscriptionId) return null
      if (!isConsolePromoEligibleStatus(row.status)) return null

      return {
        stripeSubscriptionId: row.stripeSubscriptionId,
        status: row.status,
        productIds: productIdsForPlan(row.plan),
      }
    },
  }
}

export function createStripeConsolePromoGateway(
  stripeClient: Stripe,
): ConsolePromoStripeGateway {
  return {
    findPromotionCodeByCode: async (code) => {
      const listed = await stripeClient.promotionCodes.list({
        code,
        limit: 1,
      })
      const first = listed.data[0]
      return first ? mapPromotionCodeLookup(first) : null
    },

    retrieveCoupon: (couponId) => retrieveLibraryCoupon(stripeClient, couponId),

    applyPromotionCodeDiscount: async ({
      stripeSubscriptionId,
      promotionCodeId,
    }) => {
      await stripeClient.subscriptions.update(stripeSubscriptionId, {
        discounts: [{ promotion_code: promotionCodeId }],
        proration_behavior: 'none',
      })
    },

    clearDiscounts: async (stripeSubscriptionId) => {
      await stripeClient.subscriptions.update(stripeSubscriptionId, {
        discounts: [],
        proration_behavior: 'none',
      })
    },
  }
}

export function createConsolePromoReadGateway(
  stripeClient: Stripe,
  client: PrismaClient = prisma,
): ConsolePromoReadGateway {
  return {
    read: (input) =>
      readLiveSubscriptionDiscount(input, {
        prisma: client,
        stripeClient,
      }),
  }
}

async function resolveStripeSubscriptionIdForDiscountRead(
  userId: string,
  runtime: ConsolePromoRuntime,
): Promise<string | null> {
  const eligible = await runtime.store.findEligibleSubscriptionByUserId(userId)
  if (eligible) return eligible.stripeSubscriptionId

  // No eligible seat: still try latest subscription id for soft display.
  const row = await runtime.client.subscription.findFirst({
    where: {
      referenceId: userId,
      stripeSubscriptionId: { not: null },
    },
    orderBy: { id: 'desc' },
    select: { stripeSubscriptionId: true },
  })
  return row?.stripeSubscriptionId ?? null
}

export async function readConsoleSubscriptionDiscountForUser(
  userId: string,
  deps: ConsolePromoDeps,
) {
  const runtime = createConsolePromoRuntime(deps)
  const stripeSubscriptionId = await resolveStripeSubscriptionIdForDiscountRead(
    userId,
    runtime,
  )
  if (!stripeSubscriptionId) {
    return { ok: true as const, presence: 'none' as const }
  }

  return readLiveSubscriptionDiscount(
    { stripeSubscriptionId },
    { prisma: runtime.client, stripeClient: deps.stripeClient },
  )
}

export async function loadConsolePromoRedeemPreflightForUser(
  input: { userId: string },
  deps: ConsolePromoDeps,
) {
  const { store, read } = createConsolePromoRuntime(deps)
  return loadConsolePromoRedeemPreflight(store, read, input)
}

export async function redeemPromotionCodeForUser(
  input: {
    userId: string
    code: string
    confirmReplace: boolean
  },
  deps: ConsolePromoDeps,
) {
  const { store, stripe, read } = createConsolePromoRuntime(deps)
  return redeemPromotionCodeOnSubscription(store, stripe, read, input)
}

export async function removePromoDiscountForUser(
  input: { userId: string },
  deps: ConsolePromoDeps,
) {
  const { store, stripe, read } = createConsolePromoRuntime(deps)
  return removePromoDiscountFromSubscription(store, stripe, read, input)
}

export type { ConsolePromoEligibleStatus }
