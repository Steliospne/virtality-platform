import type Stripe from 'stripe'
import {
  COUPON_LIBRARY_ARCHIVE_METADATA_KEY,
  COUPON_DURATIONS,
  isCouponArchivedMetadata,
  type CouponDuration,
  type CouponLibraryCreateParams,
  type CouponLibraryRecord,
  type CouponLibraryStripeGateway,
} from '@virtality/shared/utils'

function isCouponDuration(value: string): value is CouponDuration {
  return (COUPON_DURATIONS as readonly string[]).includes(value)
}

function mapDuration(duration: string): CouponDuration {
  return isCouponDuration(duration) ? duration : 'once'
}

function productIdsFromAppliesTo(coupon: Stripe.Coupon): string[] {
  const appliesTo = coupon.applies_to
  if (!appliesTo || typeof appliesTo !== 'object') return []
  if (!Array.isArray(appliesTo.products)) return []
  return appliesTo.products
}

function mapStripeCoupon(coupon: Stripe.Coupon): CouponLibraryRecord {
  return {
    id: coupon.id,
    name: coupon.name,
    percentOff: coupon.percent_off,
    amountOff: coupon.amount_off,
    currency: coupon.currency,
    duration: mapDuration(coupon.duration),
    durationInMonths: coupon.duration_in_months,
    appliesToProductIds: productIdsFromAppliesTo(coupon),
    archived: isCouponArchivedMetadata(coupon.metadata),
    created: coupon.created,
  }
}

export function createStripeCouponLibraryGateway(
  stripeClient: Stripe,
): CouponLibraryStripeGateway {
  // List (and some mutate) responses omit applies_to; retrieve for a complete record.
  const retrieveMapped = async (id: string) =>
    mapStripeCoupon(await stripeClient.coupons.retrieve(id))

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
      return retrieveMapped(created.id)
    },

    list: async () => {
      const coupons: CouponLibraryRecord[] = []
      for await (const coupon of stripeClient.coupons.list({ limit: 100 })) {
        coupons.push(await retrieveMapped(coupon.id))
      }
      return coupons
    },

    updateName: async (id, name) => {
      await stripeClient.coupons.update(id, { name })
      return retrieveMapped(id)
    },

    archive: async (id) => {
      const existing = await stripeClient.coupons.retrieve(id)
      await stripeClient.coupons.update(id, {
        metadata: {
          ...existing.metadata,
          [COUPON_LIBRARY_ARCHIVE_METADATA_KEY]: 'true',
        },
      })
      return retrieveMapped(id)
    },

    delete: async (id) => {
      await stripeClient.coupons.del(id)
    },
  }
}
