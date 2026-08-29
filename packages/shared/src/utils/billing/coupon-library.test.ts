import { describe, expect, it } from 'vitest'
import {
  COUPON_LIBRARY_CURRENCY,
  CouponLibraryValidationError,
  PRO_PLAN_PRODUCT_ID,
  archiveLibraryCoupon,
  createLibraryCoupon,
  deleteLibraryCoupon,
  listCouponsForApplyPicker,
  listLibraryCoupons,
  updateLibraryCouponName,
  type CouponLibraryCreateParams,
  type CouponLibraryRecord,
  type CouponLibraryStripeGateway,
} from './coupon-library.ts'

function baseRecord(
  overrides: Partial<CouponLibraryRecord> = {},
): CouponLibraryRecord {
  return {
    id: 'cou_1',
    name: 'Pro launch',
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

function createGateway(
  overrides: Partial<CouponLibraryStripeGateway> = {},
): CouponLibraryStripeGateway {
  return {
    create: async (input) =>
      baseRecord({
        name: input.name,
        percentOff: input.percentOff ?? null,
        amountOff: input.amountOff ?? null,
        currency: input.currency ?? null,
        duration: input.duration,
        durationInMonths: input.durationInMonths ?? null,
        appliesToProductIds: input.productIds,
      }),
    list: async () => [],
    updateName: async (id, name) => baseRecord({ id, name }),
    archive: async (id) => baseRecord({ id, archived: true }),
    delete: async () => undefined,
    ...overrides,
  }
}

describe('createLibraryCoupon', () => {
  it('creates a percent-off Coupon for Pro with once duration', async () => {
    const created: CouponLibraryCreateParams[] = []
    const gateway = createGateway({
      create: async (input) => {
        created.push(input)
        return baseRecord({
          name: input.name,
          percentOff: input.percentOff ?? null,
          amountOff: input.amountOff ?? null,
          currency: input.currency ?? null,
          duration: input.duration,
          durationInMonths: input.durationInMonths ?? null,
          appliesToProductIds: input.productIds,
        })
      },
    })

    const result = await createLibraryCoupon(gateway, {
      name: 'Pro launch',
      percentOff: 20,
      duration: 'once',
      planIds: ['pro'],
    })

    expect(result).toMatchObject({
      name: 'Pro launch',
      percentOff: 20,
      amountOff: null,
      duration: 'once',
      appliesToProductIds: [PRO_PLAN_PRODUCT_ID],
      archived: false,
    })
    expect(created[0]).toMatchObject({
      name: 'Pro launch',
      percentOff: 20,
      duration: 'once',
      productIds: [PRO_PLAN_PRODUCT_ID],
    })
    expect(created[0]?.currency).toBeUndefined()
    expect(created[0]?.amountOff).toBeUndefined()
  })

  it('creates repeating amount-off Coupons in catalog currency', async () => {
    let captured: CouponLibraryCreateParams | undefined
    const gateway = createGateway({
      create: async (input) => {
        captured = input
        return baseRecord({
          name: input.name,
          percentOff: null,
          amountOff: input.amountOff ?? null,
          currency: input.currency ?? null,
          duration: input.duration,
          durationInMonths: input.durationInMonths ?? null,
          appliesToProductIds: input.productIds,
        })
      },
    })

    const result = await createLibraryCoupon(gateway, {
      name: 'Flat ten',
      amountOff: 1000,
      duration: 'repeating',
      durationInMonths: 3,
      planIds: ['pro'],
    })

    expect(captured).toMatchObject({
      amountOff: 1000,
      currency: COUPON_LIBRARY_CURRENCY,
      duration: 'repeating',
      durationInMonths: 3,
      productIds: [PRO_PLAN_PRODUCT_ID],
    })
    expect(result.amountOff).toBe(1000)
    expect(result.currency).toBe(COUPON_LIBRARY_CURRENCY)
  })

  it('rejects non-catalog amount-off currency', async () => {
    await expect(
      createLibraryCoupon(createGateway(), {
        name: 'Flat',
        amountOff: 1000,
        currency: 'usd',
        duration: 'forever',
        planIds: ['pro'],
      }),
    ).rejects.toBeInstanceOf(CouponLibraryValidationError)
  })

  it('rejects create without a plan for applies_to', async () => {
    await expect(
      createLibraryCoupon(createGateway(), {
        name: 'No plan',
        percentOff: 10,
        duration: 'forever',
        planIds: [],
      }),
    ).rejects.toThrow(/at least one plan/i)
  })

  it('requires durationInMonths for repeating Coupons', async () => {
    await expect(
      createLibraryCoupon(createGateway(), {
        name: 'Repeat',
        percentOff: 10,
        duration: 'repeating',
        planIds: ['pro'],
      }),
    ).rejects.toThrow(/durationInMonths/i)
  })
})

describe('listLibraryCoupons', () => {
  it('returns live Stripe Coupons including archived for the library page', async () => {
    const gateway = createGateway({
      list: async () => [
        baseRecord({ id: 'cou_active', archived: false }),
        baseRecord({ id: 'cou_archived', name: 'Old', archived: true }),
      ],
    })

    const listed = await listLibraryCoupons(gateway)

    expect(listed.map((c) => c.id)).toEqual(['cou_active', 'cou_archived'])
    expect(listed.find((c) => c.id === 'cou_archived')?.archived).toBe(true)
  })

  it('hides archived Coupons from the apply picker', () => {
    const picker = listCouponsForApplyPicker([
      baseRecord({ id: 'cou_active', archived: false }),
      baseRecord({ id: 'cou_archived', archived: true }),
    ])
    expect(picker.map((c) => c.id)).toEqual(['cou_active'])
  })
})

describe('updateLibraryCouponName', () => {
  it('updates name only through the Stripe gateway', async () => {
    let updated: { id: string; name: string } | undefined
    const gateway = createGateway({
      updateName: async (id, name) => {
        updated = { id, name }
        return baseRecord({ id, name })
      },
    })

    const result = await updateLibraryCouponName(gateway, {
      id: 'cou_1',
      name: '  Renamed  ',
    })

    expect(updated).toEqual({ id: 'cou_1', name: 'Renamed' })
    expect(result.name).toBe('Renamed')
  })
})

describe('archiveLibraryCoupon', () => {
  it('archives so the Coupon is hidden from apply picker', async () => {
    const gateway = createGateway({
      archive: async (id) => baseRecord({ id, archived: true }),
    })

    const result = await archiveLibraryCoupon(gateway, 'cou_1')
    expect(result.archived).toBe(true)
    expect(listCouponsForApplyPicker([result])).toEqual([])
  })
})

describe('deleteLibraryCoupon', () => {
  it('hard-deletes the Stripe Coupon', async () => {
    const deleted: string[] = []
    const gateway = createGateway({
      delete: async (id) => {
        deleted.push(id)
      },
    })

    await deleteLibraryCoupon(gateway, 'cou_1')
    expect(deleted).toEqual(['cou_1'])
  })
})
