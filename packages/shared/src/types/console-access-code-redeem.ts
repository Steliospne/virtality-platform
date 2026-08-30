import { z } from 'zod'

export const redeemAccessCodeInputSchema = z.object({
  code: z.string().trim().min(1).max(50),
})

export type RedeemAccessCodeInput = z.infer<typeof redeemAccessCodeInputSchema>
