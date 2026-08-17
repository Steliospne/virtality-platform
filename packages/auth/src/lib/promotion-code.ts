import type Stripe from 'stripe'
import {
  isCouponArchivedMetadata,
  type PromotionCodeCreateParams,
  type PromotionCodeRecord,
  type PromotionCodeStripeGateway,
} from '@virtality/shared/utils'

function couponIdFromPromotionCode(
  promotionCode: Stripe.PromotionCode,
): string {
  const coupon = promotionCode.coupon
  if (typeof coupon === 'string') return coupon
  return coupon.id
}

function mapStripePromotionCode(
  promotionCode: Stripe.PromotionCode,
): PromotionCodeRecord {
  return {
    id: promotionCode.id,
    code: promotionCode.code,
    couponId: couponIdFromPromotionCode(promotionCode),
    active: promotionCode.active,
    expiresAt: promotionCode.expires_at,
    maxRedemptions: promotionCode.max_redemptions,
    timesRedeemed: promotionCode.times_redeemed,
    created: promotionCode.created,
  }
}

export function createStripePromotionCodeGateway(
  stripeClient: Stripe,
): PromotionCodeStripeGateway {
  return {
    getCoupon: async (couponId) => {
      try {
        const coupon = await stripeClient.coupons.retrieve(couponId)
        return {
          id: coupon.id,
          archived: isCouponArchivedMetadata(coupon.metadata),
        }
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          (error as { code?: string }).code === 'resource_missing'
        ) {
          return null
        }
        throw error
      }
    },

    create: async (input: PromotionCodeCreateParams) => {
      const params: Stripe.PromotionCodeCreateParams = {
        coupon: input.couponId,
      }
      if (input.code !== undefined) {
        params.code = input.code
      }
      if (input.expiresAt !== undefined) {
        params.expires_at = input.expiresAt
      }
      if (input.maxRedemptions !== undefined) {
        params.max_redemptions = input.maxRedemptions
      }

      const created = await stripeClient.promotionCodes.create(params)
      return mapStripePromotionCode(created)
    },

    listByCoupon: async (couponId) => {
      const records: PromotionCodeRecord[] = []
      for await (const promotionCode of stripeClient.promotionCodes.list({
        coupon: couponId,
        limit: 100,
      })) {
        records.push(mapStripePromotionCode(promotionCode))
      }
      return records
    },

    retrieve: async (id) => {
      try {
        const promotionCode = await stripeClient.promotionCodes.retrieve(id)
        return mapStripePromotionCode(promotionCode)
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          (error as { code?: string }).code === 'resource_missing'
        ) {
          return null
        }
        throw error
      }
    },

    deactivate: async (id) => {
      const updated = await stripeClient.promotionCodes.update(id, {
        active: false,
      })
      return mapStripePromotionCode(updated)
    },
  }
}
