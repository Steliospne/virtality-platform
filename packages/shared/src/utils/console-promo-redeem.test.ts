import { describe, expect, it, vi } from 'vitest'
import type { CouponLibraryRecord } from './coupon-library.ts'
import { PRO_PLAN_PRODUCT_ID } from './coupon-library.ts'
import type { SubscriptionDiscountRead } from './subscription-discount-read.ts'
import {
  ConsolePromoConfirmRequiredError,
  ConsolePromoCouponUnavailableError,
  ConsolePromoInvalidCodeError,
  ConsolePromoNoEligibleSubscriptionError,
  ConsolePromoNotPromoError,
  ConsolePromoReadFailedError,
  ConsolePromoStaffBlockedError,
  ConsolePromoValidationError,
  loadConsolePromoRedeemPreflight,
  redeemPromotionCodeOnSubscription,
  removePromoDiscountFromSubscription,
  replaceConfirmDiscountLabel,
  requiresReplaceConfirm,
  stripeSubscriptionIdForLiveDiscountDisplay,
  type ConsolePromoEligibleSubscription,
  type ConsolePromoReadGateway,
  type ConsolePromoStore,
  type ConsolePromoStripeGateway,
  type PromotionCodeLookup,
} from './console-promo-redeem.ts'

function coupon(
  overrides: Partial<CouponLibraryRecord> = {},
): CouponLibraryRecord {
  return {
    id: 'cou_promo',
    name: 'Spring intro',
    percentOff: 20,
    amountOff: null,
    currency: null,
    duration: 'once',
    durationInMonths: null,
    appliesToProductIds: [PRO_PLAN_PRODUCT_ID],
    archived: false,
    created: 1_700_000_000,
    ...overrides,
  }
}

function lookup(
  overrides: Partial<PromotionCodeLookup> = {},
): PromotionCodeLookup {
  return {
    id: 'promo_1',
    code: 'SPRING20',
    couponId: 'cou_promo',
    active: true,
    expiresAt: null,
    maxRedemptions: null,
    timesRedeemed: 0,
    ...overrides,
  }
}

function eligible(
  overrides: Partial<ConsolePromoEligibleSubscription> = {},
): ConsolePromoEligibleSubscription {
  return {
    stripeSubscriptionId: 'sub_1',
    status: 'active',
    productIds: [PRO_PLAN_PRODUCT_ID],
    ...overrides,
  }
}

function createStore(
  subscription: ConsolePromoEligibleSubscription | null,
): ConsolePromoStore {
  return {
    findEligibleSubscriptionByUserId: async (userId) =>
      userId === 'user_1' ? subscription : null,
  }
}

function createStripe(
  overrides: Partial<ConsolePromoStripeGateway> = {},
): ConsolePromoStripeGateway {
  return {
    findPromotionCodeByCode: async () => lookup(),
    retrieveCoupon: async () => coupon(),
    applyPromotionCodeDiscount: async () => undefined,
    clearDiscounts: async () => undefined,
    ...overrides,
  }
}

function createRead(result: SubscriptionDiscountRead): ConsolePromoReadGateway {
  return { read: async () => result }
}

const noneRead: SubscriptionDiscountRead = { ok: true, presence: 'none' }

const promoRead: SubscriptionDiscountRead = {
  ok: true,
  presence: 'one',
  channel: 'promo',
  discountId: 'di_1',
  couponId: 'cou_old',
  couponName: 'Old promo',
  promotionCodeId: 'promo_old',
  promotionCode: 'OLD20',
  start: 1,
  end: null,
  percentOff: 10,
  amountOff: null,
  currency: null,
  duration: 'once',
  durationInMonths: null,
}

const staffRead: SubscriptionDiscountRead = {
  ...promoRead,
  channel: 'staff',
  promotionCodeId: null,
  promotionCode: null,
  couponName: 'Staff deal',
}

const campaignRead: SubscriptionDiscountRead = {
  ...promoRead,
  channel: 'campaign',
  promotionCodeId: null,
  promotionCode: null,
  couponName: 'Launch',
}

describe('requiresReplaceConfirm and replaceConfirmDiscountLabel', () => {
  it('requires confirm only for campaign or prior promo', () => {
    expect(requiresReplaceConfirm(promoRead)).toBe(true)
    expect(requiresReplaceConfirm(campaignRead)).toBe(true)
    expect(requiresReplaceConfirm(staffRead)).toBe(false)
    expect(requiresReplaceConfirm(noneRead)).toBe(false)
  })

  it('labels replace-confirm from promo code or Coupon name', () => {
    expect(replaceConfirmDiscountLabel(promoRead)).toBe('OLD20')
    expect(replaceConfirmDiscountLabel(campaignRead)).toBe('Launch')
    expect(replaceConfirmDiscountLabel(staffRead)).toBeNull()
    expect(replaceConfirmDiscountLabel(noneRead)).toBeNull()
    expect(replaceConfirmDiscountLabel(undefined)).toBeNull()
  })
})

describe('loadConsolePromoRedeemPreflight', () => {
  it('reports can_apply when no Discount is present', async () => {
    const result = await loadConsolePromoRedeemPreflight(
      createStore(eligible()),
      createRead(noneRead),
      { userId: 'user_1' },
    )
    expect(result).toEqual({
      ok: true,
      state: 'can_apply',
      stripeSubscriptionId: 'sub_1',
      status: 'active',
    })
  })

  it('requires replace confirm for campaign or prior promo', async () => {
    const campaign = await loadConsolePromoRedeemPreflight(
      createStore(eligible()),
      createRead(campaignRead),
      { userId: 'user_1' },
    )
    expect(campaign).toMatchObject({
      ok: true,
      state: 'needs_replace_confirm',
      currentChannel: 'campaign',
      currentLabel: 'Launch',
    })

    const priorPromo = await loadConsolePromoRedeemPreflight(
      createStore(eligible()),
      createRead(promoRead),
      { userId: 'user_1' },
    )
    expect(priorPromo).toMatchObject({
      ok: true,
      state: 'needs_replace_confirm',
      currentChannel: 'promo',
      currentLabel: 'OLD20',
    })
  })

  it('blocks redeem when staff Discount is present', async () => {
    const result = await loadConsolePromoRedeemPreflight(
      createStore(eligible()),
      createRead(staffRead),
      { userId: 'user_1' },
    )
    expect(result).toEqual({
      ok: true,
      state: 'staff_blocked',
      stripeSubscriptionId: 'sub_1',
      status: 'active',
    })
  })

  it('fails closed when the seat or Discount read is unavailable', async () => {
    expect(
      await loadConsolePromoRedeemPreflight(
        createStore(null),
        createRead(noneRead),
        { userId: 'user_1' },
      ),
    ).toEqual({ ok: false, reason: 'no_eligible_subscription' })

    expect(
      await loadConsolePromoRedeemPreflight(
        createStore(eligible()),
        createRead({ ok: false, reason: 'stripe_unavailable' }),
        { userId: 'user_1' },
      ),
    ).toEqual({ ok: false, reason: 'read_failed' })
  })
})

describe('redeemPromotionCodeOnSubscription', () => {
  it('applies a Promotion Code when no Discount is present', async () => {
    const applied: Array<{
      stripeSubscriptionId: string
      promotionCodeId: string
    }> = []
    const result = await redeemPromotionCodeOnSubscription(
      createStore(eligible()),
      createStripe({
        applyPromotionCodeDiscount: async (input) => {
          applied.push(input)
        },
      }),
      createRead(noneRead),
      { userId: 'user_1', code: 'spring20', confirmReplace: false },
    )

    expect(applied).toEqual([
      { stripeSubscriptionId: 'sub_1', promotionCodeId: 'promo_1' },
    ])
    expect(result).toMatchObject({
      promotionCodeId: 'promo_1',
      promotionCode: 'SPRING20',
      replaced: false,
      previous: null,
    })
  })

  it('replaces campaign/prior promo only after confirmReplace', async () => {
    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe(),
        createRead(campaignRead),
        { userId: 'user_1', code: 'SPRING20', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoConfirmRequiredError)

    const result = await redeemPromotionCodeOnSubscription(
      createStore(eligible()),
      createStripe(),
      createRead(campaignRead),
      { userId: 'user_1', code: 'SPRING20', confirmReplace: true },
    )
    expect(result).toMatchObject({
      replaced: true,
      previous: { channel: 'campaign', label: 'Launch' },
    })
  })

  it('rejects staff Discount without applying', async () => {
    const apply = vi.fn()
    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe({ applyPromotionCodeDiscount: apply }),
        createRead(staffRead),
        { userId: 'user_1', code: 'SPRING20', confirmReplace: true },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoStaffBlockedError)
    expect(apply).not.toHaveBeenCalled()
  })

  it('folds unknown, inactive, expired, and maxed codes into invalid_code', async () => {
    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe({ findPromotionCodeByCode: async () => null }),
        createRead(noneRead),
        { userId: 'user_1', code: 'NOPE', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoInvalidCodeError)

    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe({
          findPromotionCodeByCode: async () => lookup({ active: false }),
        }),
        createRead(noneRead),
        { userId: 'user_1', code: 'SPRING20', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoInvalidCodeError)

    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe({
          findPromotionCodeByCode: async () =>
            lookup({ expiresAt: 1_600_000_000 }),
        }),
        createRead(noneRead),
        {
          userId: 'user_1',
          code: 'SPRING20',
          confirmReplace: false,
          nowUnix: 1_700_000_000,
        },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoInvalidCodeError)

    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe({
          findPromotionCodeByCode: async () =>
            lookup({ maxRedemptions: 1, timesRedeemed: 1 }),
        }),
        createRead(noneRead),
        { userId: 'user_1', code: 'SPRING20', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoInvalidCodeError)
  })

  it('rejects archived Coupons and applies_to misses', async () => {
    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe({
          retrieveCoupon: async () => coupon({ archived: true }),
        }),
        createRead(noneRead),
        { userId: 'user_1', code: 'SPRING20', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoCouponUnavailableError)

    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible({ productIds: ['prod_other'] })),
        createStripe(),
        createRead(noneRead),
        { userId: 'user_1', code: 'SPRING20', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoCouponUnavailableError)
  })

  it('rejects empty code and missing eligible Subscription', async () => {
    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe(),
        createRead(noneRead),
        { userId: 'user_1', code: '  ', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoValidationError)

    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(null),
        createStripe(),
        createRead(noneRead),
        { userId: 'user_1', code: 'SPRING20', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoNoEligibleSubscriptionError)
  })

  it('fails closed when Discount read fails', async () => {
    await expect(
      redeemPromotionCodeOnSubscription(
        createStore(eligible()),
        createStripe(),
        createRead({ ok: false, reason: 'registry_unavailable' }),
        { userId: 'user_1', code: 'SPRING20', confirmReplace: false },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoReadFailedError)
  })
})

describe('removePromoDiscountFromSubscription', () => {
  it('clears only a promo Discount', async () => {
    const cleared: string[] = []
    const result = await removePromoDiscountFromSubscription(
      createStore(eligible()),
      createStripe({
        clearDiscounts: async (id) => {
          cleared.push(id)
        },
      }),
      createRead(promoRead),
      { userId: 'user_1' },
    )

    expect(cleared).toEqual(['sub_1'])
    expect(result).toEqual({
      stripeSubscriptionId: 'sub_1',
      previousPromotionCode: 'OLD20',
    })
  })

  it('rejects staff, campaign, and none without clearing', async () => {
    const clear = vi.fn()
    const stripe = createStripe({ clearDiscounts: clear })

    await expect(
      removePromoDiscountFromSubscription(
        createStore(eligible()),
        stripe,
        createRead(staffRead),
        { userId: 'user_1' },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoNotPromoError)

    await expect(
      removePromoDiscountFromSubscription(
        createStore(eligible()),
        stripe,
        createRead(campaignRead),
        { userId: 'user_1' },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoNotPromoError)

    await expect(
      removePromoDiscountFromSubscription(
        createStore(eligible()),
        stripe,
        createRead(noneRead),
        { userId: 'user_1' },
      ),
    ).rejects.toBeInstanceOf(ConsolePromoNotPromoError)

    expect(clear).not.toHaveBeenCalled()
  })
})

describe('stripeSubscriptionIdForLiveDiscountDisplay', () => {
  it('returns null when there is no eligible seat (ignore canceled history)', () => {
    // Canceled Subscriptions can still carry Discount objects (e.g. SAVE25
    // duration once, end null). Billing must not rewrite plan cards from them.
    expect(stripeSubscriptionIdForLiveDiscountDisplay(null)).toBeNull()
  })

  it('returns the eligible seat Subscription id', () => {
    expect(
      stripeSubscriptionIdForLiveDiscountDisplay({
        stripeSubscriptionId: 'sub_live',
      }),
    ).toBe('sub_live')
  })
})
