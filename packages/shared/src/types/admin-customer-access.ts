import { z } from 'zod'
import { entitlementExtensionDurationUnitSchema } from './entitlement-extension.js'

export const adminCustomerAccessReasonSchema = z
  .string()
  .trim()
  .min(3, 'Reason must be at least 3 characters')

export const assignPermanentFreeInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
})

export const grantTimedTrialInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  amount: z.number().int().positive(),
  unit: entitlementExtensionDurationUnitSchema,
})

export type AssignPermanentFreeInput = z.infer<
  typeof assignPermanentFreeInputSchema
>

export type GrantTimedTrialInput = z.infer<typeof grantTimedTrialInputSchema>
