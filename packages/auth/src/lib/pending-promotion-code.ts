import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import { PRO_PLAN_PRODUCT_ID } from '@virtality/shared/utils'
import type {
  OpenPendingPromotionCodeHold,
  PendingPromotionCodeCouponTerms,
} from '@virtality/shared/types'
import type Stripe from 'stripe'
import { retrieveLibraryCoupon } from './coupon-library.ts'

export const PENDING_PROMOTION_CODE_TTL_MS = 2 * 60 * 1000

export type { OpenPendingPromotionCodeHold, PendingPromotionCodeCouponTerms }

type PendingPromotionCodeDeps = {
  prisma?: PrismaClient
  stripeClient: Stripe
}

type PendingPromotionCodeRow = {
  id: string
  userId: string
  code: string
  promotionCodeId: string
  couponId: string
  expiresAt: Date
}

function getClient(client?: PrismaClient): PrismaClient {
  return client ?? prisma
}

function couponIdFromPromotionCode(
  promotionCode: Stripe.PromotionCode,
): string {
  const coupon = promotionCode.coupon
  return typeof coupon === 'string' ? coupon : coupon.id
}

async function resolvePromotionCodeForProCheckout(
  stripeClient: Stripe,
  code: string,
): Promise<{
  code: string
  promotionCodeId: string
  couponId: string
  couponTerms: PendingPromotionCodeCouponTerms
}> {
  const trimmed = code.trim()
  if (!trimmed) {
    throw new Error('Promotion Code is required')
  }

  const listed = await stripeClient.promotionCodes.list({
    code: trimmed,
    limit: 1,
  })
  const promotionCode = listed.data[0]
  if (!promotionCode || !promotionCode.active) {
    throw new Error('That Promotion Code is invalid or cannot be applied.')
  }

  if (
    promotionCode.expires_at != null &&
    promotionCode.expires_at * 1000 <= Date.now()
  ) {
    throw new Error('That Promotion Code is invalid or cannot be applied.')
  }

  if (
    promotionCode.max_redemptions != null &&
    promotionCode.times_redeemed >= promotionCode.max_redemptions
  ) {
    throw new Error('That Promotion Code is invalid or cannot be applied.')
  }

  const couponId = couponIdFromPromotionCode(promotionCode)
  const coupon = await retrieveLibraryCoupon(stripeClient, couponId)
  if (!coupon || coupon.archived) {
    throw new Error(
      'That Promotion Code cannot be applied to this plan (Coupon archived, deleted, or does not apply).',
    )
  }
  if (
    coupon.appliesToProductIds.length > 0 &&
    !coupon.appliesToProductIds.includes(PRO_PLAN_PRODUCT_ID)
  ) {
    throw new Error(
      'That Promotion Code cannot be applied to this plan (Coupon archived, deleted, or does not apply).',
    )
  }

  return {
    code: promotionCode.code,
    promotionCodeId: promotionCode.id,
    couponId,
    couponTerms: {
      percentOff: coupon.percentOff,
      amountOff: coupon.amountOff,
    },
  }
}

async function expireOpenPendingPromotionCodes(
  client: PrismaClient,
  userId: string,
  now: Date,
) {
  await client.pendingPromotionCode.updateMany({
    where: {
      userId,
      status: 'open',
      expiresAt: { lte: now },
    },
    data: {
      status: 'expired',
      updatedAt: now,
    },
  })
}

export async function savePendingPromotionCodeForCheckout(
  input: { userId: string; code: string; now?: Date },
  deps: PendingPromotionCodeDeps,
) {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  const resolved = await resolvePromotionCodeForProCheckout(
    deps.stripeClient,
    input.code,
  )

  await expireOpenPendingPromotionCodes(client, input.userId, now)
  await client.pendingPromotionCode.updateMany({
    where: { userId: input.userId, status: 'open' },
    data: {
      status: 'canceled',
      updatedAt: now,
    },
  })

  const expiresAt = new Date(now.getTime() + PENDING_PROMOTION_CODE_TTL_MS)
  const row = await client.pendingPromotionCode.create({
    data: {
      userId: input.userId,
      code: resolved.code,
      promotionCodeId: resolved.promotionCodeId,
      couponId: resolved.couponId,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    },
  })

  return { ...row, couponTerms: resolved.couponTerms }
}

export async function getOpenPendingPromotionCodeForCheckout(
  input: { userId: string; now?: Date },
  deps: PendingPromotionCodeDeps,
): Promise<PendingPromotionCodeRow | null> {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  await expireOpenPendingPromotionCodes(client, input.userId, now)
  return client.pendingPromotionCode.findFirst({
    where: {
      userId: input.userId,
      status: 'open',
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      code: true,
      promotionCodeId: true,
      couponId: true,
      expiresAt: true,
    },
  })
}

/**
 * Open Checkout hold for Billing display (code + Coupon terms).
 * Cancels the row when the Coupon is missing or archived so chrome cannot stick.
 */
export async function readOpenPendingPromotionCodeForCheckout(
  input: { userId: string; now?: Date },
  deps: PendingPromotionCodeDeps,
): Promise<OpenPendingPromotionCodeHold | null> {
  const row = await getOpenPendingPromotionCodeForCheckout(input, deps)
  if (!row) return null

  const coupon = await retrieveLibraryCoupon(deps.stripeClient, row.couponId)
  if (!coupon || coupon.archived) {
    await cancelPendingPromotionCodeForCheckout(input, {
      prisma: deps.prisma,
    })
    return null
  }

  return {
    code: row.code,
    promotionCodeId: row.promotionCodeId,
    couponId: row.couponId,
    expiresAt: row.expiresAt,
    couponTerms: {
      percentOff: coupon.percentOff,
      amountOff: coupon.amountOff,
    },
  }
}

export async function cancelPendingPromotionCodeForCheckout(
  input: { userId: string; now?: Date },
  deps: Pick<PendingPromotionCodeDeps, 'prisma'>,
) {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  await expireOpenPendingPromotionCodes(client, input.userId, now)
  const result = await client.pendingPromotionCode.updateMany({
    where: {
      userId: input.userId,
      status: 'open',
      expiresAt: { gt: now },
    },
    data: {
      status: 'canceled',
      updatedAt: now,
    },
  })
  return result.count
}

export async function markPendingPromotionCodeAppliedForCheckout(
  input: { userId: string; now?: Date },
  deps: Pick<PendingPromotionCodeDeps, 'prisma'>,
) {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  await expireOpenPendingPromotionCodes(client, input.userId, now)
  const result = await client.pendingPromotionCode.updateMany({
    where: {
      userId: input.userId,
      status: 'open',
      expiresAt: { gt: now },
    },
    data: {
      status: 'applied',
      updatedAt: now,
    },
  })
  return result.count
}
