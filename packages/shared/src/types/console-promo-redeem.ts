import { z } from 'zod'

export const redeemPromotionCodeInputSchema = z.object({
  code: z.string().trim().min(1).max(50),
  confirmReplace: z.boolean(),
})

export type RedeemPromotionCodeInput = z.infer<
  typeof redeemPromotionCodeInputSchema
>
