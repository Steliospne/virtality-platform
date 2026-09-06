import { z } from 'zod'
import {
  entitlementExtensionDirectionSchema,
  entitlementExtensionDurationUnitSchema,
} from './entitlement-extension.js'

export const adminCustomerAccessReasonSchema = z
  .string()
  .trim()
  .min(3, 'Reason must be at least 3 characters')

export const assignPermanentAccessGateInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
})

export type AssignPermanentAccessGateInput = z.infer<
  typeof assignPermanentAccessGateInputSchema
>

export const setAccessGateTrialInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  amount: z.number().int().positive(),
  unit: entitlementExtensionDurationUnitSchema,
  direction: entitlementExtensionDirectionSchema.default('extend'),
})

export type SetAccessGateTrialInput = z.infer<
  typeof setAccessGateTrialInputSchema
>

export const revokeAccessGateInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
})

export type RevokeAccessGateInput = z.infer<typeof revokeAccessGateInputSchema>
