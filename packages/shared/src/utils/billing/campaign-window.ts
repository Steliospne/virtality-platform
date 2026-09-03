/**
 * Adminboard Campaign Window + Subscribe Checkout Coupon attach (#66 / #79).
 *
 * At most one scheduled-or-live window picks a library Coupon and start/end.
 * While live and healthy, Subscribe Checkout (`!hadPaidBilling`) auto-attaches
 * that Coupon. Renew is excluded. Unhealthy Coupons omit attach without
 * blocking Checkout. Closing the window stops new attaches; Campaign registry
 * retains historical Coupon ids (caller registers via onCouponSelected).
 */

import {
  DEFAULT_PLAN_PRODUCT_ID,
  type CouponLibraryRecord,
} from './coupon-library.ts'

export const CAMPAIGN_WINDOW_SINGLETON_ID = 'singleton' as const

export type CampaignWindowLifecycle =
  | 'none'
  | 'scheduled'
  | 'live'
  | 'ended'
  | 'closed'

export type CampaignCouponHealth =
  | 'healthy'
  | 'archived'
  | 'deleted'
  | 'applies_to_miss'

export type CampaignWindowRecord = {
  id: string
  couponId: string
  startsAt: Date
  endsAt: Date
  closedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type UpsertCampaignWindowInput = {
  couponId: string
  startsAt: Date
  endsAt: Date
}

export type CampaignWindowStore = {
  get: () => Promise<CampaignWindowRecord | null>
  save: (record: CampaignWindowRecord) => Promise<CampaignWindowRecord>
}

export class CampaignWindowValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CampaignWindowValidationError'
  }
}

export function resolveCampaignWindowLifecycle(
  window: CampaignWindowRecord | null,
  now: Date,
): CampaignWindowLifecycle {
  if (!window) return 'none'
  if (window.closedAt != null) return 'closed'
  if (now.getTime() < window.startsAt.getTime()) return 'scheduled'
  if (now.getTime() >= window.endsAt.getTime()) return 'ended'
  return 'live'
}

/** True only while the window is live (attaches can happen). */
export function isCampaignWindowAttaching(
  window: CampaignWindowRecord | null | undefined,
  now: Date,
): boolean {
  return resolveCampaignWindowLifecycle(window ?? null, now) === 'live'
}

/** Empty `appliesToProductIds` means the Coupon applies store-wide (the norm since Coupons no longer set `applies_to` on create). */
export function assessCampaignCouponHealth(
  coupon: CouponLibraryRecord | null,
): CampaignCouponHealth {
  if (!coupon) return 'deleted'
  if (coupon.archived) return 'archived'
  if (
    coupon.appliesToProductIds.length > 0 &&
    !coupon.appliesToProductIds.includes(DEFAULT_PLAN_PRODUCT_ID)
  ) {
    return 'applies_to_miss'
  }
  return 'healthy'
}

/**
 * Coupon id to put on Checkout `discounts: [{ coupon }]`, or null to omit.
 * Never pairs with `allow_promotion_codes` (caller must not set that flag).
 */
export function resolveCampaignCheckoutCouponId(input: {
  window: CampaignWindowRecord | null
  couponHealth: CampaignCouponHealth
  hadPaidBilling: boolean
  now: Date
}): string | null {
  const { window } = input
  if (input.hadPaidBilling) return null
  if (!window) return null
  if (!isCampaignWindowAttaching(window, input.now)) return null
  if (input.couponHealth !== 'healthy') return null
  return window.couponId
}

/** Checkout Session params for campaign attach (no allow_promotion_codes). */
export type CampaignCheckoutSessionParams = {
  payment_method_collection: 'always'
  discounts?: Array<{ coupon: string } | { promotion_code: string }>
}

export function toCampaignCheckoutSessionParams(
  couponId: string | null,
): CampaignCheckoutSessionParams {
  const params: CampaignCheckoutSessionParams = {
    payment_method_collection: 'always',
  }
  if (couponId) {
    params.discounts = [{ coupon: couponId }]
  }
  return params
}

export function listCouponsForCampaignPicker(
  coupons: readonly CouponLibraryRecord[],
): CouponLibraryRecord[] {
  return coupons.filter(
    (coupon) =>
      !coupon.archived &&
      (coupon.appliesToProductIds.length === 0 ||
        coupon.appliesToProductIds.includes(DEFAULT_PLAN_PRODUCT_ID)),
  )
}

function requireCouponId(couponId: string): string {
  const trimmed = couponId.trim()
  if (!trimmed) {
    throw new CampaignWindowValidationError('Coupon id is required')
  }
  return trimmed
}

function validateWindowDates(startsAt: Date, endsAt: Date): void {
  if (!(startsAt instanceof Date) || Number.isNaN(startsAt.getTime())) {
    throw new CampaignWindowValidationError('startsAt must be a valid date')
  }
  if (!(endsAt instanceof Date) || Number.isNaN(endsAt.getTime())) {
    throw new CampaignWindowValidationError('endsAt must be a valid date')
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new CampaignWindowValidationError('endsAt must be after startsAt')
  }
}

export async function upsertCampaignWindow(
  store: CampaignWindowStore,
  input: UpsertCampaignWindowInput,
  deps: {
    now?: () => Date
    onCouponSelected?: (couponId: string) => Promise<void>
  } = {},
): Promise<CampaignWindowRecord> {
  const couponId = requireCouponId(input.couponId)
  validateWindowDates(input.startsAt, input.endsAt)

  const now = (deps.now ?? (() => new Date()))()
  const existing = await store.get()

  const record: CampaignWindowRecord = {
    id: existing?.id ?? CAMPAIGN_WINDOW_SINGLETON_ID,
    couponId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    closedAt: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  const saved = await store.save(record)
  if (deps.onCouponSelected) {
    await deps.onCouponSelected(couponId)
  }
  return saved
}

export async function closeCampaignWindow(
  store: CampaignWindowStore,
  deps: {
    now?: () => Date
  } = {},
): Promise<CampaignWindowRecord | null> {
  const existing = await store.get()
  if (!existing) return null

  const now = (deps.now ?? (() => new Date()))()
  if (existing.closedAt != null) return existing

  return store.save({
    ...existing,
    closedAt: now,
    updatedAt: now,
  })
}

/** Adminboard view: whether Checkout would attach right now for a Subscribe seat. */
export function isCampaignAttachingForAdminboard(input: {
  window: CampaignWindowRecord | null
  couponHealth: CampaignCouponHealth
  now: Date
}): boolean {
  return (
    resolveCampaignCheckoutCouponId({
      window: input.window,
      couponHealth: input.couponHealth,
      hadPaidBilling: false,
      now: input.now,
    }) != null
  )
}
