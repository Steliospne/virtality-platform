import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  CONSOLE_PROMO_ELIGIBLE_STATUSES,
  DEFAULT_PLAN_PRODUCT_ID,
  isConsolePromoEligibleStatus,
  loadConsolePromoRedeemPreflight,
  redeemPromotionCodeOnSubscription,
  removePromoDiscountFromSubscription,
  stripeSubscriptionIdForLiveDiscountDisplay,
  type ConsolePromoEligibleStatus,
  type ConsolePromoReadGateway,
  type ConsolePromoStore,
  type ConsolePromoStripeGateway,
  type PromotionCodeLookup,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { retrieveLibraryCoupon } from './coupon-library.ts'
import {
  armLivePromotionCodeHold,
  discardOpenPendingPromotionCodeHold,
  getOpenPendingPromotionCodeForCheckout,
  savePendingPromotionCodeForCheckout,
  sweepExpiredPromotionCodeHoldsForUser,
} from './pending-promotion-code.ts'
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
  if (plan === 'default' || plan.trim() === '') {
    return [DEFAULT_PLAN_PRODUCT_ID]
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
      // `discounts: []` on Subscription update is a no-op (Stripe treats an
      // empty/omitted `discounts` array as "inherit from the Customer," not
      // "clear the Subscription's Discount") — the dedicated delete-discount
      // endpoint is the only reliable way to actually remove it.
      await stripeClient.subscriptions.deleteDiscount(stripeSubscriptionId)
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
  return stripeSubscriptionIdForLiveDiscountDisplay(eligible)
}

export async function readConsoleSubscriptionDiscountForUser(
  userId: string,
  deps: ConsolePromoDeps,
) {
  // Revert any Discount whose hold TTL already lapsed before reading live
  // state, so this always reflects reality rather than a stale Stripe read.
  await sweepExpiredPromotionCodeHoldsForUser({ userId }, deps)

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
  const result = await redeemPromotionCodeOnSubscription(
    store,
    stripe,
    read,
    input,
  )
  // Arm the same 2-minute TTL a pre-Checkout hold gets: a Discount redeemed
  // straight onto a live Subscription auto-reverts unless explicitly kept
  // (there's no separate "keep" step — every self-serve redeem is temporary
  // until this window is renewed by a fresh redeem, same as any other hold).
  await armLivePromotionCodeHold(
    {
      userId: input.userId,
      code: result.promotionCode,
      promotionCodeId: result.promotionCodeId,
      couponId: result.couponId,
      liveSubscriptionId: result.stripeSubscriptionId,
    },
    { prisma: deps.prisma },
  )
  return result
}

export async function removePromoDiscountForUser(
  input: { userId: string },
  deps: ConsolePromoDeps,
) {
  const { store, stripe, read } = createConsolePromoRuntime(deps)
  const result = await removePromoDiscountFromSubscription(
    store,
    stripe,
    read,
    input,
  )
  // Discount is already cleared on Stripe above — just drop the hold row in
  // the database; no second (redundant) Stripe call.
  await discardOpenPendingPromotionCodeHold(
    { userId: input.userId },
    { prisma: deps.prisma },
  )
  return result
}

/**
 * Resolve the Promotion Code to attach to a brand-new Checkout Session.
 *
 * Bridges the two Discount systems: an open pre-subscribe hold wins first
 * (2-minute TTL, same as `savePendingPromotionCodeForCheckout`); otherwise, a
 * promo-channel Discount already live on the user's current eligible
 * Subscription is re-validated against Stripe and mirrored into a fresh
 * 2-minute hold, so every code that reaches a new Checkout Session — however
 * it originated — passes through the same short, re-validated TTL window.
 */
export async function resolvePromotionCodeForNewCheckout(
  input: { userId: string; now?: Date },
  deps: ConsolePromoDeps,
): Promise<{ promotionCodeId: string } | null> {
  const now = input.now ?? new Date()

  const existingHold = await getOpenPendingPromotionCodeForCheckout(
    { userId: input.userId, now },
    deps,
  )
  if (existingHold) {
    return { promotionCodeId: existingHold.promotionCodeId }
  }

  const liveDiscount = await readConsoleSubscriptionDiscountForUser(
    input.userId,
    deps,
  )
  if (
    !liveDiscount.ok ||
    liveDiscount.presence !== 'one' ||
    liveDiscount.channel !== 'promo' ||
    !liveDiscount.promotionCode
  ) {
    return null
  }

  try {
    const mirrored = await savePendingPromotionCodeForCheckout(
      { userId: input.userId, code: liveDiscount.promotionCode, now },
      deps,
    )
    return { promotionCodeId: mirrored.promotionCodeId }
  } catch {
    // Live Discount's code no longer resolves (archived / maxed out /
    // product mismatch since it was applied) — new Checkout proceeds
    // without it rather than failing the whole Checkout start.
    return null
  }
}

export type { ConsolePromoEligibleStatus }
