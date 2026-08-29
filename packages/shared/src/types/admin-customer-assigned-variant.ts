import { z } from 'zod'
import { adminCustomerAccessReasonSchema } from './admin-customer-access.js'

export const assignProVariantInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  variantName: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/),
})

export const listAssignableProVariantsInputSchema = z.object({
  userId: z.string().trim().min(1).optional(),
})

export type AssignProVariantInput = z.infer<typeof assignProVariantInputSchema>

export type ListAssignableProVariantsInput = z.infer<
  typeof listAssignableProVariantsInputSchema
>
