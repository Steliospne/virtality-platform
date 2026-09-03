import { z } from 'zod'
import { adminCustomerAccessReasonSchema } from './admin-customer-access.js'

export const supportedDefaultPlanPriceIdSchema = z.enum([
  'price_1SeVrm4Fc2DAAhEfIWIRZ2v9',
  'price_1U3f2g4Fc2DAAhEfk5EkH3u1',
])

export const adminCustomerBillingCheckoutUrlsSchema = z.object({
  successUrl: z.string().trim().url().optional(),
  cancelUrl: z.string().trim().url().optional(),
})

export const previewChangePaidPlanInputSchema = z.object({
  userId: z.string().trim().min(1),
  targetPriceId: supportedDefaultPlanPriceIdSchema,
})

export const changePaidPlanInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  targetPriceId: supportedDefaultPlanPriceIdSchema,
  successUrl: z.string().trim().url().optional(),
  cancelUrl: z.string().trim().url().optional(),
})

export const cancelPaidSubscriptionInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  mode: z.enum(['immediate', 'period_end']),
})

export const reactivatePaidSubscriptionInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
})

export const cancelCyclePlanChangeInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
})

export const assignFreeAfterCancellationInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
})

export const sendPaidCheckoutLinkInputSchema = changePaidPlanInputSchema

export type PreviewChangePaidPlanInput = z.infer<
  typeof previewChangePaidPlanInputSchema
>
export type ChangePaidPlanInput = z.infer<typeof changePaidPlanInputSchema>
export type CancelPaidSubscriptionInput = z.infer<
  typeof cancelPaidSubscriptionInputSchema
>
export type ReactivatePaidSubscriptionInput = z.infer<
  typeof reactivatePaidSubscriptionInputSchema
>
export type CancelCyclePlanChangeInput = z.infer<
  typeof cancelCyclePlanChangeInputSchema
>
export type AssignFreeAfterCancellationInput = z.infer<
  typeof assignFreeAfterCancellationInputSchema
>
export type SendPaidCheckoutLinkInput = z.infer<
  typeof sendPaidCheckoutLinkInputSchema
>
