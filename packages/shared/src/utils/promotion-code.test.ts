import { describe, expect, it } from 'vitest'
import {
  createPromotionCode,
  deactivatePromotionCode,
  listPromotionCodesForCoupon,
  notifyPromotionCodeDelivery,
  PromotionCodeNotFoundError,
  PromotionCodeNotShareableError,
  PromotionCodeValidationError,
  sendPromotionCodeEmail,
  type PromotionCodeCreateParams,
  type PromotionCodeDeliveryRecord,
  type PromotionCodeDeliveryStore,
  type PromotionCodeRecord,
  type PromotionCodeStripeGateway,
} from './promotion-code.ts'

function baseRecord(
  overrides: Partial<PromotionCodeRecord> = {},
): PromotionCodeRecord {
  return {
    id: 'promo_1',
    code: 'SAVE20',
    couponId: 'cou_1',
    active: true,
    expiresAt: null,
    maxRedemptions: null,
    timesRedeemed: 0,
    created: 1_700_000_000,
    ...overrides,
  }
}

function createGateway(
  overrides: Partial<PromotionCodeStripeGateway> = {},
): PromotionCodeStripeGateway {
  return {
    getCoupon: async (couponId) => ({ id: couponId, archived: false }),
    create: async (input) =>
      baseRecord({
        couponId: input.couponId,
        code: input.code ?? 'AUTOCODE1',
        expiresAt: input.expiresAt ?? null,
        maxRedemptions: input.maxRedemptions ?? null,
      }),
    listByCoupon: async () => [],
    retrieve: async (id) => baseRecord({ id }),
    deactivate: async (id) => baseRecord({ id, active: false }),
    ...overrides,
  }
}

describe('createPromotionCode', () => {
  it('rejects case-insensitive TE- and PAY- prefixes', async () => {
    const gateway = createGateway()

    await expect(
      createPromotionCode(gateway, { couponId: 'cou_1', code: 'te-SAVE20' }),
    ).rejects.toBeInstanceOf(PromotionCodeValidationError)

    await expect(
      createPromotionCode(gateway, { couponId: 'cou_1', code: 'PAY-SAVE20' }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/TE-|PAY-/),
    })
  })

  it('creates from a non-archived Coupon and omits blank code for Stripe auto-generate', async () => {
    const created: PromotionCodeCreateParams[] = []
    const gateway = createGateway({
      create: async (input) => {
        created.push(input)
        return baseRecord({
          couponId: input.couponId,
          code: input.code ?? 'STRIPEGEN1',
        })
      },
    })

    const result = await createPromotionCode(gateway, {
      couponId: 'cou_1',
      code: '  ',
    })

    expect(result.code).toBe('STRIPEGEN1')
    expect(created[0]).toEqual({ couponId: 'cou_1' })
    expect(created[0]?.code).toBeUndefined()
  })

  it('rejects create on an archived Coupon', async () => {
    const gateway = createGateway({
      getCoupon: async (id) => ({ id, archived: true }),
    })

    await expect(
      createPromotionCode(gateway, { couponId: 'cou_1', code: 'SAVE20' }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/archived/i),
    })
  })

  it('passes optional expiresAt and maxRedemptions at create only', async () => {
    const created: PromotionCodeCreateParams[] = []
    const gateway = createGateway({
      create: async (input) => {
        created.push(input)
        return baseRecord({
          couponId: input.couponId,
          code: input.code ?? 'SAVE20',
          expiresAt: input.expiresAt ?? null,
          maxRedemptions: input.maxRedemptions ?? null,
        })
      },
    })

    const result = await createPromotionCode(gateway, {
      couponId: 'cou_1',
      code: 'SAVE20',
      expiresAt: 1_800_000_000,
      maxRedemptions: 5,
    })

    expect(result).toMatchObject({
      expiresAt: 1_800_000_000,
      maxRedemptions: 5,
    })
    expect(created[0]).toMatchObject({
      code: 'SAVE20',
      expiresAt: 1_800_000_000,
      maxRedemptions: 5,
    })
  })
})

describe('listPromotionCodesForCoupon', () => {
  it('lists live Promotion Codes for a Coupon', async () => {
    const gateway = createGateway({
      listByCoupon: async (couponId) => [
        baseRecord({ id: 'promo_a', couponId, code: 'A', active: true }),
        baseRecord({ id: 'promo_b', couponId, code: 'B', active: false }),
      ],
    })

    const list = await listPromotionCodesForCoupon(gateway, 'cou_1')
    expect(list).toHaveLength(2)
    expect(list.map((row) => row.active)).toEqual([true, false])
  })
})

describe('deactivatePromotionCode', () => {
  it('deactivates an active Promotion Code', async () => {
    const gateway = createGateway({
      retrieve: async (id) => baseRecord({ id, active: true }),
      deactivate: async (id) => baseRecord({ id, active: false }),
    })

    const result = await deactivatePromotionCode(gateway, 'promo_1')
    expect(result.active).toBe(false)
  })
})

describe('sendPromotionCodeEmail', () => {
  it('sends for active codes and blocks inactive share', async () => {
    const delivered: { recipientEmail: string; code: string }[] = []
    const activeGateway = createGateway({
      retrieve: async (id) => baseRecord({ id, active: true, code: 'SAVE20' }),
    })

    const payload = await sendPromotionCodeEmail(
      activeGateway,
      { id: 'promo_1', recipientEmail: 'clinician@clinic.example' },
      {
        billingUrl: 'https://console.example/profile?tab=billing',
        deliver: async (entry) => {
          delivered.push(entry)
        },
      },
    )

    expect(payload).toMatchObject({
      recipientEmail: 'clinician@clinic.example',
      code: 'SAVE20',
    })
    expect(delivered).toHaveLength(1)

    const inactiveGateway = createGateway({
      retrieve: async (id) => baseRecord({ id, active: false }),
    })

    await expect(
      sendPromotionCodeEmail(
        inactiveGateway,
        { id: 'promo_1', recipientEmail: 'clinician@clinic.example' },
        {
          billingUrl: 'https://console.example/profile?tab=billing',
          deliver: async () => undefined,
        },
      ),
    ).rejects.toBeInstanceOf(PromotionCodeNotShareableError)
  })
})

describe('notifyPromotionCodeDelivery', () => {
  function createStore(
    overrides: Partial<PromotionCodeDeliveryStore> = {},
  ): PromotionCodeDeliveryStore {
    return {
      findUserById: async (userId) => ({ id: userId }),
      upsertOpen: async (data) =>
        ({
          id: 'del_1',
          userId: data.userId,
          promotionCodeId: data.promotionCodeId,
          code: data.code,
          couponId: data.couponId,
          status: 'open',
          createdAt: data.now,
          updatedAt: data.now,
        }) satisfies PromotionCodeDeliveryRecord,
      ...overrides,
    }
  }

  it('upserts one open Delivery for an active Promotion Code', async () => {
    const upserts: string[] = []
    const gateway = createGateway({
      retrieve: async (id) =>
        baseRecord({ id, active: true, code: 'SAVE20', couponId: 'cou_1' }),
    })
    const store = createStore({
      upsertOpen: async (data) => {
        upserts.push(`${data.userId}:${data.promotionCodeId}`)
        return {
          id: 'del_1',
          userId: data.userId,
          promotionCodeId: data.promotionCodeId,
          code: data.code,
          couponId: data.couponId,
          status: 'open',
          createdAt: data.now,
          updatedAt: data.now,
        }
      },
    })

    const row = await notifyPromotionCodeDelivery(gateway, store, {
      promotionCodeId: 'promo_1',
      userId: 'user_1',
    })

    expect(row).toMatchObject({
      userId: 'user_1',
      promotionCodeId: 'promo_1',
      code: 'SAVE20',
      status: 'open',
    })
    expect(upserts).toEqual(['user_1:promo_1'])
  })

  it('blocks in-app notify when the Promotion Code is inactive', async () => {
    const gateway = createGateway({
      retrieve: async (id) => baseRecord({ id, active: false }),
    })

    await expect(
      notifyPromotionCodeDelivery(gateway, createStore(), {
        promotionCodeId: 'promo_1',
        userId: 'user_1',
      }),
    ).rejects.toBeInstanceOf(PromotionCodeNotShareableError)
  })

  it('rejects unknown Promotion Codes', async () => {
    const gateway = createGateway({
      retrieve: async () => null,
    })

    await expect(
      notifyPromotionCodeDelivery(gateway, createStore(), {
        promotionCodeId: 'promo_missing',
        userId: 'user_1',
      }),
    ).rejects.toBeInstanceOf(PromotionCodeNotFoundError)
  })
})
