/**
 * Console Profile → Billing mid-cycle Promotion Code redeem + promo remove
 * (#65 / #67 / #72 / issue #78).
 *
 * Apply via Subscription `discounts: [{ promotion_code }]`; clear with
 * `discounts: []` only (no restore). Staff channel blocks redeem; clinician
 * self-remove is promo-only. Fail closed on live Discount read failure.
 */

import type { CouponLibraryRecord } from './coupon-library.ts'
import type {
  DiscountChannel,
  SubscriptionDiscountRead,
} from './subscription-discount-read.ts'

export const CONSOLE_PROMO_ELIGIBLE_STATUSES = [
  'active',
  'trialing',
  'past_due',
] as const

export type ConsolePromoEligibleStatus =
  (typeof CONSOLE_PROMO_ELIGIBLE_STATUSES)[number]

export type ConsolePromoEligibleSubscription = {
  stripeSubscriptionId: string
  status: ConsolePromoEligibleStatus
  /** Product ids on Subscription items (applies_to check). */
  productIds: string[]
}

export type PromotionCodeLookup = {
  id: string
  code: string
  couponId: string
  active: boolean
  /** Unix seconds; null = no expiry. */
  expiresAt: number | null
  maxRedemptions: number | null
  timesRedeemed: number
}

export type ConsolePromoStore = {
  findEligibleSubscriptionByUserId: (
    userId: string,
  ) => Promise<ConsolePromoEligibleSubscription | null>
}

export type ConsolePromoStripeGateway = {
  findPromotionCodeByCode: (code: string) => Promise<PromotionCodeLookup | null>
  retrieveCoupon: (couponId: string) => Promise<CouponLibraryRecord | null>
  applyPromotionCodeDiscount: (input: {
    stripeSubscriptionId: string
    promotionCodeId: string
  }) => Promise<void>
  clearDiscounts: (stripeSubscriptionId: string) => Promise<void>
}

export type ConsolePromoReadGateway = {
  read: (input: {
    stripeSubscriptionId: string
  }) => Promise<SubscriptionDiscountRead>
}

export type ConsolePromoCurrentLabel = {
  channel: DiscountChannel
  label: string
} | null

export type ConsolePromoRedeemPreflight =
  | {
      ok: true
      state: 'can_apply' | 'needs_replace_confirm' | 'staff_blocked'
      stripeSubscriptionId: string
      status: ConsolePromoEligibleStatus
      currentChannel?: DiscountChannel
      currentLabel?: string
    }
  | { ok: false; reason: 'no_eligible_subscription' | 'read_failed' }

export type RedeemPromotionCodeInput = {
  userId: string
  code: string
  /** Required when replacing campaign or prior promo. */
  confirmReplace: boolean
  /** Unix seconds; defaults to now. */
  nowUnix?: number
}

export type RemovePromoDiscountInput = {
  userId: string
}

export type RedeemPromotionCodeResult = {
  stripeSubscriptionId: string
  promotionCodeId: string
  promotionCode: string
  couponId: string
  previous: ConsolePromoCurrentLabel
  replaced: boolean
}

export type RemovePromoDiscountResult = {
  stripeSubscriptionId: string
  previousPromotionCode: string | null
}

export class ConsolePromoValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConsolePromoValidationError'
  }
}

export class ConsolePromoNoEligibleSubscriptionError extends Error {
  constructor(userId: string) {
    super(
      `No eligible Subscription (active, trialing, or past_due) found for user "${userId}".`,
    )
    this.name = 'ConsolePromoNoEligibleSubscriptionError'
  }
}

export class ConsolePromoStaffBlockedError extends Error {
  constructor() {
    super(
      'A staff-applied Discount is already on this subscription, so a Promotion Code cannot be applied.',
    )
    this.name = 'ConsolePromoStaffBlockedError'
  }
}

export class ConsolePromoConfirmRequiredError extends Error {
  constructor() {
    super(
      'Confirm is required before replacing the current campaign or Promotion Code Discount.',
    )
    this.name = 'ConsolePromoConfirmRequiredError'
  }
}

export class ConsolePromoInvalidCodeError extends Error {
  constructor() {
    super('That Promotion Code is invalid or cannot be applied.')
    this.name = 'ConsolePromoInvalidCodeError'
  }
}

export class ConsolePromoCouponUnavailableError extends Error {
  constructor() {
    super(
      'That Promotion Code cannot be applied to this plan (Coupon archived, deleted, or does not apply).',
    )
    this.name = 'ConsolePromoCouponUnavailableError'
  }
}

export class ConsolePromoReadFailedError extends Error {
  constructor() {
    super(
      'Could not read the current Subscription Discount. Try again shortly.',
    )
    this.name = 'ConsolePromoReadFailedError'
  }
}

export class ConsolePromoNotPromoError extends Error {
  constructor() {
    super('Only a Promotion Code Discount can be removed here.')
    this.name = 'ConsolePromoNotPromoError'
  }
}

export function isConsolePromoEligibleStatus(
  status: string,
): status is ConsolePromoEligibleStatus {
  return (CONSOLE_PROMO_ELIGIBLE_STATUSES as readonly string[]).includes(status)
}

function currentDiscountLabel(
  read: Extract<SubscriptionDiscountRead, { ok: true }>,
): ConsolePromoCurrentLabel {
  if (read.presence === 'none') return null

  if (read.channel === 'promo') {
    const code = read.promotionCode?.trim()
    return {
      channel: 'promo',
      label: code ? code : (read.couponName ?? read.couponId),
    }
  }

  return {
    channel: read.channel,
    label: read.couponName?.trim() ? read.couponName : read.couponId,
  }
}

function assertUserId(userId: string): void {
  if (!userId.trim()) {
    throw new ConsolePromoValidationError('userId is required')
  }
}

function normalizeCode(code: string): string {
  const trimmed = code.trim()
  if (!trimmed) {
    throw new ConsolePromoValidationError('Promotion Code is required')
  }
  return trimmed
}

async function requireEligibleSubscription(
  store: ConsolePromoStore,
  userId: string,
): Promise<ConsolePromoEligibleSubscription> {
  const subscription = await store.findEligibleSubscriptionByUserId(userId)
  if (!subscription) {
    throw new ConsolePromoNoEligibleSubscriptionError(userId)
  }
  return subscription
}

async function requireConfirmRead(
  readGateway: ConsolePromoReadGateway,
  stripeSubscriptionId: string,
): Promise<Extract<SubscriptionDiscountRead, { ok: true }>> {
  let read: SubscriptionDiscountRead
  try {
    read = await readGateway.read({ stripeSubscriptionId })
  } catch {
    throw new ConsolePromoReadFailedError()
  }
  if (!read.ok) {
    throw new ConsolePromoReadFailedError()
  }
  return read
}

function assertPromotionCodeRedeemable(
  promotionCode: PromotionCodeLookup,
  nowUnix: number,
): void {
  if (!promotionCode.active) {
    throw new ConsolePromoInvalidCodeError()
  }
  if (promotionCode.expiresAt != null && promotionCode.expiresAt <= nowUnix) {
    throw new ConsolePromoInvalidCodeError()
  }
  if (
    promotionCode.maxRedemptions != null &&
    promotionCode.timesRedeemed >= promotionCode.maxRedemptions
  ) {
    throw new ConsolePromoInvalidCodeError()
  }
}

async function requireApplicableCoupon(
  stripe: ConsolePromoStripeGateway,
  couponId: string,
  productIds: string[],
): Promise<CouponLibraryRecord> {
  const coupon = await stripe.retrieveCoupon(couponId)
  if (!coupon || coupon.archived) {
    throw new ConsolePromoCouponUnavailableError()
  }

  const applies = coupon.appliesToProductIds
  if (applies.length > 0) {
    const overlap = productIds.some((id) => applies.includes(id))
    if (!overlap) {
      throw new ConsolePromoCouponUnavailableError()
    }
  }

  return coupon
}

/**
 * Redeem preflight for Console Billing: staff-block, replace-confirm, or apply.
 */
export async function loadConsolePromoRedeemPreflight(
  store: ConsolePromoStore,
  readGateway: ConsolePromoReadGateway,
  input: { userId: string },
): Promise<ConsolePromoRedeemPreflight> {
  assertUserId(input.userId)

  const subscription = await store.findEligibleSubscriptionByUserId(
    input.userId,
  )
  if (!subscription) {
    return { ok: false, reason: 'no_eligible_subscription' }
  }

  let read: SubscriptionDiscountRead
  try {
    read = await readGateway.read({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    })
  } catch {
    return { ok: false, reason: 'read_failed' }
  }
  if (!read.ok) {
    return { ok: false, reason: 'read_failed' }
  }

  if (read.presence === 'one' && read.channel === 'staff') {
    return {
      ok: true,
      state: 'staff_blocked',
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: subscription.status,
    }
  }

  if (read.presence === 'one') {
    const current = currentDiscountLabel(read)
    return {
      ok: true,
      state: 'needs_replace_confirm',
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: subscription.status,
      currentChannel: current?.channel,
      currentLabel: current?.label,
    }
  }

  return {
    ok: true,
    state: 'can_apply',
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    status: subscription.status,
  }
}

/**
 * Apply or replace the seat's Subscription Discount with a Promotion Code.
 * Fail-closed on live Discount read; staff blocks; replace needs confirm.
 */
export async function redeemPromotionCodeOnSubscription(
  store: ConsolePromoStore,
  stripe: ConsolePromoStripeGateway,
  readGateway: ConsolePromoReadGateway,
  input: RedeemPromotionCodeInput,
): Promise<RedeemPromotionCodeResult> {
  assertUserId(input.userId)
  const code = normalizeCode(input.code)
  const nowUnix = input.nowUnix ?? Math.floor(Date.now() / 1000)

  const subscription = await requireEligibleSubscription(store, input.userId)
  const priorRead = await requireConfirmRead(
    readGateway,
    subscription.stripeSubscriptionId,
  )
  const previous = currentDiscountLabel(priorRead)

  if (priorRead.presence === 'one' && priorRead.channel === 'staff') {
    throw new ConsolePromoStaffBlockedError()
  }

  if (
    priorRead.presence === 'one' &&
    (priorRead.channel === 'campaign' || priorRead.channel === 'promo') &&
    !input.confirmReplace
  ) {
    throw new ConsolePromoConfirmRequiredError()
  }

  const promotionCode = await stripe.findPromotionCodeByCode(code)
  if (!promotionCode) {
    throw new ConsolePromoInvalidCodeError()
  }
  assertPromotionCodeRedeemable(promotionCode, nowUnix)
  await requireApplicableCoupon(
    stripe,
    promotionCode.couponId,
    subscription.productIds,
  )

  await stripe.applyPromotionCodeDiscount({
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    promotionCodeId: promotionCode.id,
  })

  return {
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    promotionCodeId: promotionCode.id,
    promotionCode: promotionCode.code,
    couponId: promotionCode.couponId,
    previous,
    replaced: previous != null,
  }
}

/**
 * Clear a promo Discount only (`discounts: []`). No restore of prior Discount.
 */
export async function removePromoDiscountFromSubscription(
  store: ConsolePromoStore,
  stripe: ConsolePromoStripeGateway,
  readGateway: ConsolePromoReadGateway,
  input: RemovePromoDiscountInput,
): Promise<RemovePromoDiscountResult> {
  assertUserId(input.userId)

  const subscription = await requireEligibleSubscription(store, input.userId)
  const priorRead = await requireConfirmRead(
    readGateway,
    subscription.stripeSubscriptionId,
  )

  if (priorRead.presence !== 'one' || priorRead.channel !== 'promo') {
    throw new ConsolePromoNotPromoError()
  }

  await stripe.clearDiscounts(subscription.stripeSubscriptionId)

  return {
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    previousPromotionCode: priorRead.promotionCode,
  }
}
