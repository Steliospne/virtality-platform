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
