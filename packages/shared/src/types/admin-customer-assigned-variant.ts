import { z } from 'zod'
import { adminCustomerAccessReasonSchema } from './admin-customer-access.js'

export const assignPlanVariantInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  variantName: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/),
})

export const listAssignablePlanVariantsInputSchema = z.object({
  userId: z.string().trim().min(1).optional(),
})

export type AssignPlanVariantInput = z.infer<
  typeof assignPlanVariantInputSchema
>

export type ListAssignablePlanVariantsInput = z.infer<
  typeof listAssignablePlanVariantsInputSchema
>
