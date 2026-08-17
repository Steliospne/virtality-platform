import type Stripe from 'stripe'
import {
  COUPON_LIBRARY_ARCHIVE_METADATA_KEY,
  COUPON_DURATIONS,
  archiveLibraryCoupon,
  createLibraryCoupon,
  deleteLibraryCoupon,
  isCouponArchivedMetadata,
  listLibraryCoupons,
  updateLibraryCouponName,
  type CouponDuration,
  type CouponLibraryCreateParams,
  type CouponLibraryRecord,
  type CouponLibraryStripeGateway,
  type CreateLibraryCouponInput,
  type UpdateLibraryCouponNameInput,
} from '@virtality/shared/utils'

function mapDuration(duration: string): CouponDuration {
  if ((COUPON_DURATIONS as readonly string[]).includes(duration)) {
    return duration as CouponDuration
  }
  return 'once'
}

function mapStripeCoupon(coupon: Stripe.Coupon): CouponLibraryRecord {
  const appliesTo =
    coupon.applies_to &&
    typeof coupon.applies_to === 'object' &&
    Array.isArray(coupon.applies_to.products)
      ? coupon.applies_to.products
      : []

  return {
    id: coupon.id,
    name: coupon.name,
    percentOff: coupon.percent_off,
    amountOff: coupon.amount_off,
    currency: coupon.currency,
    duration: mapDuration(coupon.duration),
    durationInMonths: coupon.duration_in_months,
    appliesToProductIds: appliesTo,
    archived: isCouponArchivedMetadata(coupon.metadata),
    created: coupon.created,
  }
}

export function createStripeCouponLibraryGateway(
  stripeClient: Stripe,
): CouponLibraryStripeGateway {
  return {
    create: async (input: CouponLibraryCreateParams) => {
      const params: Stripe.CouponCreateParams = {
        name: input.name,
        duration: input.duration,
        applies_to: {
          products: input.productIds,
        },
        metadata: {
          [COUPON_LIBRARY_ARCHIVE_METADATA_KEY]: 'false',
        },
      }

      if (input.percentOff !== undefined) {
        params.percent_off = input.percentOff
      }
      if (input.amountOff !== undefined) {
        params.amount_off = input.amountOff
        params.currency = input.currency
      }
      if (input.durationInMonths !== undefined) {
        params.duration_in_months = input.durationInMonths
      }

      const created = await stripeClient.coupons.create(params)
      // List responses omit applies_to; retrieve so the library record is complete.
      const retrieved = await stripeClient.coupons.retrieve(created.id)
      return mapStripeCoupon(retrieved)
    },

    list: async () => {
      const coupons: CouponLibraryRecord[] = []
      for await (const coupon of stripeClient.coupons.list({ limit: 100 })) {
        // applies_to is omitted from list payloads; retrieve for library display.
        const detailed = await stripeClient.coupons.retrieve(coupon.id)
        coupons.push(mapStripeCoupon(detailed))
      }
      return coupons
    },

    updateName: async (id, name) => {
      await stripeClient.coupons.update(id, { name })
      const retrieved = await stripeClient.coupons.retrieve(id)
      return mapStripeCoupon(retrieved)
    },

    archive: async (id) => {
      const existing = await stripeClient.coupons.retrieve(id)
      await stripeClient.coupons.update(id, {
        metadata: {
          ...existing.metadata,
          [COUPON_LIBRARY_ARCHIVE_METADATA_KEY]: 'true',
        },
      })
      const retrieved = await stripeClient.coupons.retrieve(id)
      return mapStripeCoupon(retrieved)
    },

    delete: async (id) => {
      await stripeClient.coupons.del(id)
    },
  }
}

export async function runCouponLibraryAction<T>(
  stripeClient: Stripe,
  run: (gateway: CouponLibraryStripeGateway) => Promise<T>,
): Promise<T> {
  return run(createStripeCouponLibraryGateway(stripeClient))
}

export function createLibraryCouponAction(
  stripeClient: Stripe,
  input: CreateLibraryCouponInput,
) {
  return runCouponLibraryAction(stripeClient, (gateway) =>
    createLibraryCoupon(gateway, input),
  )
}

export function listLibraryCouponsAction(stripeClient: Stripe) {
  return runCouponLibraryAction(stripeClient, (gateway) =>
    listLibraryCoupons(gateway),
  )
}

export function updateLibraryCouponNameAction(
  stripeClient: Stripe,
  input: UpdateLibraryCouponNameInput,
) {
  return runCouponLibraryAction(stripeClient, (gateway) =>
    updateLibraryCouponName(gateway, input),
  )
}

export function archiveLibraryCouponAction(stripeClient: Stripe, id: string) {
  return runCouponLibraryAction(stripeClient, (gateway) =>
    archiveLibraryCoupon(gateway, id),
  )
}

export function deleteLibraryCouponAction(stripeClient: Stripe, id: string) {
  return runCouponLibraryAction(stripeClient, (gateway) =>
    deleteLibraryCoupon(gateway, id),
  )
}
