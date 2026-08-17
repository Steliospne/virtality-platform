/**
 * Adminboard Promotion Codes nested under a library Coupon.
 * Stripe is SoT for codes; local persistence is Promotion Code Delivery only.
 */

import {
  CouponLibraryNotFoundError,
  type CouponLibraryRecord,
} from './coupon-library.ts'

/** Reserved prefixes collide with Tester Code (TE-) and Trial Redeem (PAY-). */
export const RESERVED_PROMOTION_CODE_PREFIXES = ['TE-', 'PAY-'] as const

export const PROMOTION_CODE_DELIVERY_STATUSES = ['open'] as const
export type PromotionCodeDeliveryStatus =
  (typeof PROMOTION_CODE_DELIVERY_STATUSES)[number]

export type PromotionCodeRecord = {
  id: string
  code: string
  couponId: string
  active: boolean
  /** Unix seconds; null = no expiry. */
  expiresAt: number | null
  maxRedemptions: number | null
  timesRedeemed: number
  /** Unix seconds from Stripe `created`. */
  created: number
}

export type CreatePromotionCodeInput = {
  couponId: string
  /** Blank/omit → Stripe auto-generates. */
  code?: string | null
  /** Unix seconds; omit = none. */
  expiresAt?: number | null
  /** Omit = unlimited. */
  maxRedemptions?: number | null
}

export type PromotionCodeCreateParams = {
  couponId: string
  code?: string
  expiresAt?: number
  maxRedemptions?: number
}

export type PromotionCodeStripeGateway = {
  getCoupon: (
    couponId: string,
  ) => Promise<Pick<CouponLibraryRecord, 'id' | 'archived'> | null>
  create: (input: PromotionCodeCreateParams) => Promise<PromotionCodeRecord>
  listByCoupon: (couponId: string) => Promise<PromotionCodeRecord[]>
  retrieve: (id: string) => Promise<PromotionCodeRecord | null>
  deactivate: (id: string) => Promise<PromotionCodeRecord>
}

export type PromotionCodeDeliveryRecord = {
  id: string
  userId: string
  promotionCodeId: string
  code: string
  couponId: string
  status: PromotionCodeDeliveryStatus
  createdAt: Date
  updatedAt: Date
}

export type PromotionCodeDeliveryStore = {
  findUserById: (userId: string) => Promise<{ id: string } | null>
  upsertOpen: (data: {
    userId: string
    promotionCodeId: string
    code: string
    couponId: string
    now: Date
  }) => Promise<PromotionCodeDeliveryRecord>
}

export class PromotionCodeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PromotionCodeValidationError'
  }
}

export class PromotionCodeNotFoundError extends Error {
  constructor(id: string) {
    super(`Promotion Code ${id} was not found.`)
    this.name = 'PromotionCodeNotFoundError'
  }
}

export class PromotionCodeNotShareableError extends Error {
  constructor(id: string) {
    super(`Promotion Code ${id} cannot be shared while inactive.`)
    this.name = 'PromotionCodeNotShareableError'
  }
}

export function hasReservedPromotionCodePrefix(code: string): boolean {
  const upper = code.trim().toUpperCase()
  return RESERVED_PROMOTION_CODE_PREFIXES.some((prefix) =>
    upper.startsWith(prefix),
  )
}

export function assertPromotionCodeNotReserved(code: string): void {
  if (hasReservedPromotionCodePrefix(code)) {
    throw new PromotionCodeValidationError(
      'Promotion Codes must not use TE- or PAY- prefixes',
    )
  }
}

function assertCouponId(couponId: string): void {
  if (!couponId.trim()) {
    throw new PromotionCodeValidationError('Coupon id is required')
  }
}

function assertPromotionCodeId(id: string): void {
  if (!id.trim()) {
    throw new PromotionCodeValidationError('Promotion Code id is required')
  }
}

function normalizeOptionalCode(
  code: string | null | undefined,
): string | undefined {
  if (code == null) return undefined
  const trimmed = code.trim()
  if (!trimmed) return undefined
  assertPromotionCodeNotReserved(trimmed)
  return trimmed
}

function normalizeOptionalExpiresAt(
  expiresAt: number | null | undefined,
): number | undefined {
  if (expiresAt == null) return undefined
  if (!Number.isInteger(expiresAt) || expiresAt <= 0) {
    throw new PromotionCodeValidationError(
      'expiresAt must be a positive unix timestamp in seconds',
    )
  }
  return expiresAt
}

function normalizeOptionalMaxRedemptions(
  maxRedemptions: number | null | undefined,
): number | undefined {
  if (maxRedemptions == null) return undefined
  if (!Number.isInteger(maxRedemptions) || maxRedemptions < 1) {
    throw new PromotionCodeValidationError(
      'maxRedemptions must be a positive integer',
    )
  }
  return maxRedemptions
}

async function requireNonArchivedCoupon(
  stripe: PromotionCodeStripeGateway,
  couponId: string,
): Promise<void> {
  assertCouponId(couponId)
  const coupon = await stripe.getCoupon(couponId)
  if (!coupon) {
    throw new CouponLibraryNotFoundError(couponId)
  }
  if (coupon.archived) {
    throw new PromotionCodeValidationError(
      'Cannot create Promotion Codes on an archived Coupon',
    )
  }
}

export async function createPromotionCode(
  stripe: PromotionCodeStripeGateway,
  input: CreatePromotionCodeInput,
): Promise<PromotionCodeRecord> {
  await requireNonArchivedCoupon(stripe, input.couponId)

  const code = normalizeOptionalCode(input.code)
  const expiresAt = normalizeOptionalExpiresAt(input.expiresAt)
  const maxRedemptions = normalizeOptionalMaxRedemptions(input.maxRedemptions)

  return stripe.create({
    couponId: input.couponId.trim(),
    ...(code !== undefined ? { code } : {}),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
    ...(maxRedemptions !== undefined ? { maxRedemptions } : {}),
  })
}

export async function listPromotionCodesForCoupon(
  stripe: PromotionCodeStripeGateway,
  couponId: string,
): Promise<PromotionCodeRecord[]> {
  assertCouponId(couponId)
  return stripe.listByCoupon(couponId.trim())
}

export async function deactivatePromotionCode(
  stripe: PromotionCodeStripeGateway,
  id: string,
): Promise<PromotionCodeRecord> {
  assertPromotionCodeId(id)
  const existing = await stripe.retrieve(id.trim())
  if (!existing) {
    throw new PromotionCodeNotFoundError(id)
  }
  if (!existing.active) {
    return existing
  }
  return stripe.deactivate(id.trim())
}

export type PromotionCodeEmailDelivery = {
  recipientEmail: string
  code: string
  billingUrl: string
}

export type SendPromotionCodeEmailInput = {
  id: string
  recipientEmail: string
}

export type SendPromotionCodeEmailRuntime = {
  deliver: (payload: PromotionCodeEmailDelivery) => Promise<void>
  billingUrl: string
}

export async function sendPromotionCodeEmail(
  stripe: PromotionCodeStripeGateway,
  input: SendPromotionCodeEmailInput,
  runtime: SendPromotionCodeEmailRuntime,
): Promise<PromotionCodeEmailDelivery> {
  assertPromotionCodeId(input.id)
  const existing = await stripe.retrieve(input.id.trim())
  if (!existing) {
    throw new PromotionCodeNotFoundError(input.id)
  }
  if (!existing.active) {
    throw new PromotionCodeNotShareableError(input.id)
  }

  const recipientEmail = input.recipientEmail.trim()
  if (!recipientEmail) {
    throw new PromotionCodeValidationError('recipientEmail is required')
  }

  const payload: PromotionCodeEmailDelivery = {
    recipientEmail,
    code: existing.code,
    billingUrl: runtime.billingUrl,
  }
  await runtime.deliver(payload)
  return payload
}

export type NotifyPromotionCodeDeliveryInput = {
  promotionCodeId: string
  userId: string
}

export async function notifyPromotionCodeDelivery(
  stripe: PromotionCodeStripeGateway,
  store: PromotionCodeDeliveryStore,
  input: NotifyPromotionCodeDeliveryInput,
  now: () => Date = () => new Date(),
): Promise<PromotionCodeDeliveryRecord> {
  assertPromotionCodeId(input.promotionCodeId)
  const userId = input.userId.trim()
  if (!userId) {
    throw new PromotionCodeValidationError('userId is required')
  }

  const existing = await stripe.retrieve(input.promotionCodeId.trim())
  if (!existing) {
    throw new PromotionCodeNotFoundError(input.promotionCodeId)
  }
  if (!existing.active) {
    throw new PromotionCodeNotShareableError(input.promotionCodeId)
  }

  const user = await store.findUserById(userId)
  if (!user) {
    throw new PromotionCodeValidationError(`User ${userId} was not found`)
  }

  return store.upsertOpen({
    userId,
    promotionCodeId: existing.id,
    code: existing.code,
    couponId: existing.couponId,
    now: now(),
  })
}
