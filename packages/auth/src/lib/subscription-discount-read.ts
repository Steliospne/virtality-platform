import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  readSubscriptionDiscount,
  type CampaignRegistry,
  type SubscriptionDiscountCouponSnapshot,
  type SubscriptionDiscountEntrySnapshot,
  type SubscriptionDiscountRead,
  type SubscriptionDiscountStripeGateway,
  type SubscriptionDiscountStripeSnapshot,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'

export function createPrismaCampaignRegistry(
  client: PrismaClient = prisma,
): CampaignRegistry {
  return {
    isCampaignCouponId: async (couponId) => {
      const row = await client.campaignRegistryCoupon.findUnique({
        where: { couponId },
        select: { couponId: true },
      })
      return row != null
    },
  }
}

/** Membership check used by channel classify (#70 / #74). */
export async function isCampaignCouponId(
  couponId: string,
  client: PrismaClient = prisma,
): Promise<boolean> {
  return createPrismaCampaignRegistry(client).isCampaignCouponId(couponId)
}

/** Persist a Coupon id into the Campaign registry (idempotent upsert). */
export async function registerCampaignCouponId(
  couponId: string,
  client: PrismaClient = prisma,
  now: () => Date = () => new Date(),
): Promise<void> {
  await client.campaignRegistryCoupon.upsert({
    where: { couponId },
    create: { couponId, createdAt: now() },
    update: {},
  })
}

function mapCoupon(
  coupon: Stripe.Coupon | string | undefined,
): SubscriptionDiscountCouponSnapshot | null {
  if (!coupon || typeof coupon === 'string') return null
  const duration = coupon.duration
  if (
    duration !== 'forever' &&
    duration !== 'once' &&
    duration !== 'repeating'
  ) {
    return null
  }
  return {
    id: coupon.id,
    name: coupon.name ?? null,
    percent_off: coupon.percent_off,
    amount_off: coupon.amount_off,
    currency: coupon.currency ?? null,
    duration,
    duration_in_months: coupon.duration_in_months,
  }
}

function mapPromotionCode(
  promotionCode: Stripe.Discount['promotion_code'],
): SubscriptionDiscountEntrySnapshot['promotion_code'] {
  if (promotionCode == null) return null
  if (typeof promotionCode === 'string') return promotionCode
  return { id: promotionCode.id, code: promotionCode.code }
}

function mapDiscount(
  entry: string | Stripe.Discount,
): SubscriptionDiscountEntrySnapshot | null {
  if (typeof entry === 'string') return null
  const coupon = mapCoupon(entry.coupon)
  if (!coupon) return null
  return {
    id: entry.id,
    start: entry.start,
    end: entry.end,
    promotion_code: mapPromotionCode(entry.promotion_code),
    coupon,
  }
}

function toSnapshot(
  subscription: Stripe.Subscription,
): SubscriptionDiscountStripeSnapshot | null {
  const rawDiscounts = subscription.discounts ?? []
  const discounts: SubscriptionDiscountEntrySnapshot[] = []
  for (const entry of rawDiscounts) {
    const mapped = mapDiscount(entry)
    if (!mapped) return null
    discounts.push(mapped)
  }

  return {
    discounts,
    items: {
      data: (subscription.items?.data ?? []).map((item) => ({
        discounts: item.discounts ?? [],
      })),
    },
  }
}

function isStripeMissingResource(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    (error as { statusCode?: number }).statusCode === 404
  )
}

export function createStripeSubscriptionDiscountGateway(
  stripeClient: Stripe,
): SubscriptionDiscountStripeGateway {
  return {
    retrieveSubscriptionWithDiscounts: async (stripeSubscriptionId) => {
      let subscription: Stripe.Subscription
      try {
        subscription = await stripeClient.subscriptions.retrieve(
          stripeSubscriptionId,
          { expand: ['discounts.promotion_code'] },
        )
      } catch (error) {
        if (isStripeMissingResource(error)) {
          return { ok: false, reason: 'subscription_missing' }
        }
        return { ok: false, reason: 'stripe_unavailable' }
      }

      const snapshot = toSnapshot(subscription)
      if (!snapshot) {
        // Unexpanded Discount/Coupon ids: treat as broken shape for this contract.
        return { ok: false, reason: 'stripe_unavailable' }
      }
      return { ok: true, subscription: snapshot }
    },
  }
}

/**
 * Live Subscription Discount + channel read for Adminboard confirm, Console
 * redeem preflight, and Billing display. Fail closed / soft-unavailable is a
 * caller policy on `ok: false` (see shared JSDoc).
 */
export async function readLiveSubscriptionDiscount(
  input: { stripeSubscriptionId: string | null | undefined },
  deps: {
    prisma?: PrismaClient
    stripeClient: Stripe
  },
): Promise<SubscriptionDiscountRead> {
  return readSubscriptionDiscount(
    input,
    createStripeSubscriptionDiscountGateway(deps.stripeClient),
    createPrismaCampaignRegistry(deps.prisma ?? prisma),
  )
}
