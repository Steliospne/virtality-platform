import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import { DEFAULT_PLAN_PRODUCT_ID } from '@virtality/shared/utils'
import type {
  OpenPendingPromotionCodeHold,
  PendingPromotionCodeCouponTerms,
} from '@virtality/shared/types'
import type Stripe from 'stripe'
import { retrieveLibraryCoupon } from './coupon-library-adapter.ts'

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
  liveSubscriptionId: string | null
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
    !coupon.appliesToProductIds.includes(DEFAULT_PLAN_PRODUCT_ID)
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

function isStripeMissingResource(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  if (!('statusCode' in error)) return false
  return (error as { statusCode?: number }).statusCode === 404
}

/**
 * Revert the live Subscription Discount a hold was tracking. Best-effort:
 * a resource that's already gone (404) counts as reverted; any other Stripe
 * error is swallowed and the row is left `open` so the next sweep retries.
 */
async function revertLiveDiscountForHold(
  stripeClient: Stripe,
  liveSubscriptionId: string,
): Promise<boolean> {
  try {
    await stripeClient.subscriptions.deleteDiscount(liveSubscriptionId)
    return true
  } catch (error) {
    return isStripeMissingResource(error)
  }
}

/**
 * Expire open holds past TTL for a user. A hold tracking a live Subscription
 * Discount (`liveSubscriptionId` set) is force-reverted via Stripe first —
 * the same 2-minute TTL applies whether the hold is a pre-Checkout code or a
 * Discount already redeemed onto a live Subscription. Rows whose Stripe
 * revert fails are left `open` for the next sweep to retry.
 */
async function sweepExpiredPendingPromotionCodes(
  client: PrismaClient,
  stripeClient: Stripe,
  userId: string,
  now: Date,
): Promise<void> {
  const due = await client.pendingPromotionCode.findMany({
    where: { userId, status: 'open', expiresAt: { lte: now } },
    select: { id: true, liveSubscriptionId: true },
  })
  if (due.length === 0) return

  const reverted: string[] = []
  for (const row of due) {
    if (row.liveSubscriptionId == null) {
      reverted.push(row.id)
      continue
    }
    const ok = await revertLiveDiscountForHold(
      stripeClient,
      row.liveSubscriptionId,
    )
    if (ok) reverted.push(row.id)
  }
  if (reverted.length === 0) return

  await client.pendingPromotionCode.updateMany({
    where: { id: { in: reverted } },
    data: { status: 'expired', updatedAt: now },
  })
}

/**
 * Public entry point for the same TTL sweep, for callers that read live
 * Discount state directly (not through a hold lookup) and need it to
 * reflect a just-expired revert rather than stale Stripe state.
 */
export async function sweepExpiredPromotionCodeHoldsForUser(
  input: { userId: string; now?: Date },
  deps: PendingPromotionCodeDeps,
): Promise<void> {
  const client = getClient(deps.prisma)
  await sweepExpiredPendingPromotionCodes(
    client,
    deps.stripeClient,
    input.userId,
    input.now ?? new Date(),
  )
}

/**
 * Scheduled-job entry point: sweep every user's expired open holds, not just
 * one. Nothing else revisits a hold while its owner stays signed out, so a
 * live Discount would otherwise outlive its TTL indefinitely.
 */
export async function sweepAllExpiredPromotionCodeHolds(
  deps: PendingPromotionCodeDeps,
  now: Date = new Date(),
): Promise<{ reverted: number; retried: number }> {
  const client = getClient(deps.prisma)
  const due = await client.pendingPromotionCode.findMany({
    where: { status: 'open', expiresAt: { lte: now } },
    select: { id: true, liveSubscriptionId: true },
  })
  if (due.length === 0) return { reverted: 0, retried: 0 }

  const reverted: string[] = []
  for (const row of due) {
    if (row.liveSubscriptionId == null) {
      reverted.push(row.id)
      continue
    }
    const ok = await revertLiveDiscountForHold(
      deps.stripeClient,
      row.liveSubscriptionId,
    )
    if (ok) reverted.push(row.id)
  }

  if (reverted.length > 0) {
    await client.pendingPromotionCode.updateMany({
      where: { id: { in: reverted } },
      data: { status: 'expired', updatedAt: now },
    })
  }

  return { reverted: reverted.length, retried: due.length - reverted.length }
}

/** Cancel any open hold, canceling out a prior in-progress redeem/apply. */
async function cancelOpenHolds(
  client: PrismaClient,
  userId: string,
  now: Date,
): Promise<void> {
  await client.pendingPromotionCode.updateMany({
    where: { userId, status: 'open' },
    data: { status: 'canceled', updatedAt: now },
  })
}

async function armPromotionCodeHold(
  client: PrismaClient,
  input: {
    userId: string
    code: string
    promotionCodeId: string
    couponId: string
    liveSubscriptionId: string | null
    now: Date
  },
): Promise<PendingPromotionCodeRow> {
  await cancelOpenHolds(client, input.userId, input.now)

  const expiresAt = new Date(
    input.now.getTime() + PENDING_PROMOTION_CODE_TTL_MS,
  )
  return client.pendingPromotionCode.create({
    data: {
      userId: input.userId,
      code: input.code,
      promotionCodeId: input.promotionCodeId,
      couponId: input.couponId,
      liveSubscriptionId: input.liveSubscriptionId,
      expiresAt,
      createdAt: input.now,
      updatedAt: input.now,
    },
    select: {
      id: true,
      userId: true,
      code: true,
      promotionCodeId: true,
      couponId: true,
      liveSubscriptionId: true,
      expiresAt: true,
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

  const row = await armPromotionCodeHold(client, {
    userId: input.userId,
    code: resolved.code,
    promotionCodeId: resolved.promotionCodeId,
    couponId: resolved.couponId,
    liveSubscriptionId: null,
    now,
  })

  return { ...row, couponTerms: resolved.couponTerms }
}

/**
 * Arm the same TTL hold for a Discount just redeemed directly onto a live
 * Subscription (mid-cycle redeem, not a pre-Checkout hold). The Discount is
 * already live on Stripe by the time this is called; the hold only tracks
 * when it must be force-reverted.
 */
export async function armLivePromotionCodeHold(
  input: {
    userId: string
    code: string
    promotionCodeId: string
    couponId: string
    liveSubscriptionId: string
    now?: Date
  },
  deps: Pick<PendingPromotionCodeDeps, 'prisma'>,
): Promise<void> {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  await armPromotionCodeHold(client, {
    userId: input.userId,
    code: input.code,
    promotionCodeId: input.promotionCodeId,
    couponId: input.couponId,
    liveSubscriptionId: input.liveSubscriptionId,
    now,
  })
}

export async function getOpenPendingPromotionCodeForCheckout(
  input: { userId: string; now?: Date },
  deps: PendingPromotionCodeDeps,
): Promise<PendingPromotionCodeRow | null> {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  await sweepExpiredPendingPromotionCodes(
    client,
    deps.stripeClient,
    input.userId,
    now,
  )
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
      liveSubscriptionId: true,
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
    await cancelPendingPromotionCodeForCheckout(input, deps)
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

/**
 * Explicit user cancel/remove of an open hold. When the hold tracks a live
 * Subscription Discount, this also reverts that Discount on Stripe — for a
 * live redeem, "cancel the hold" and "remove the Discount" are the same act.
 */
export async function cancelPendingPromotionCodeForCheckout(
  input: { userId: string; now?: Date },
  deps: PendingPromotionCodeDeps,
): Promise<number> {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  await sweepExpiredPendingPromotionCodes(
    client,
    deps.stripeClient,
    input.userId,
    now,
  )

  const open = await client.pendingPromotionCode.findMany({
    where: { userId: input.userId, status: 'open', expiresAt: { gt: now } },
    select: { id: true, liveSubscriptionId: true },
  })
  if (open.length === 0) return 0

  for (const row of open) {
    if (row.liveSubscriptionId != null) {
      await revertLiveDiscountForHold(deps.stripeClient, row.liveSubscriptionId)
    }
  }

  const result = await client.pendingPromotionCode.updateMany({
    where: { id: { in: open.map((row) => row.id) } },
    data: { status: 'canceled', updatedAt: now },
  })
  return result.count
}

/**
 * Discard a user's open hold in the database only — no Stripe call. For a
 * caller that has already reverted the live Discount itself (direct remove)
 * and just needs the hold row cleared without a second, redundant Stripe
 * request against an already-cleared Discount.
 */
export async function discardOpenPendingPromotionCodeHold(
  input: { userId: string; now?: Date },
  deps: Pick<PendingPromotionCodeDeps, 'prisma'>,
): Promise<number> {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  const result = await client.pendingPromotionCode.updateMany({
    where: { userId: input.userId, status: 'open' },
    data: { status: 'canceled', updatedAt: now },
  })
  return result.count
}

export async function markPendingPromotionCodeAppliedForCheckout(
  input: { userId: string; now?: Date },
  deps: PendingPromotionCodeDeps,
): Promise<number> {
  const client = getClient(deps.prisma)
  const now = input.now ?? new Date()
  await sweepExpiredPendingPromotionCodes(
    client,
    deps.stripeClient,
    input.userId,
    now,
  )
  const result = await client.pendingPromotionCode.updateMany({
    where: { userId: input.userId, status: 'open', expiresAt: { gt: now } },
    data: { status: 'applied', updatedAt: now },
  })
  return result.count
}
