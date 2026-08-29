import { z } from 'zod'

export const redeemPromotionCodeInputSchema = z.object({
  code: z.string().trim().min(1).max(50),
  confirmReplace: z.boolean(),
})

export const savePendingPromotionCodeInputSchema = z.object({
  code: z.string().trim().min(1).max(50),
})

export type RedeemPromotionCodeInput = z.infer<
  typeof redeemPromotionCodeInputSchema
>

export type SavePendingPromotionCodeInput = z.infer<
  typeof savePendingPromotionCodeInputSchema
>

/** Coupon terms used to rewrite plan cards while a Checkout hold is open. */
export type PendingPromotionCodeCouponTerms = {
  percentOff: number | null
  amountOff: number | null
}

/** Open Checkout hold returned to Console Billing for display + cancel. */
export type OpenPendingPromotionCodeHold = {
  code: string
  promotionCodeId: string
  couponId: string
  expiresAt: Date
  couponTerms: PendingPromotionCodeCouponTerms
}
