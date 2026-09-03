import { z } from 'zod'
import {
  entitlementExtensionDirectionSchema,
  entitlementExtensionDurationUnitSchema,
} from './entitlement-extension.js'

export const adminCustomerAccessReasonSchema = z
  .string()
  .trim()
  .min(3, 'Reason must be at least 3 characters')

export const assignPermanentFreeInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
})

export type AssignPermanentFreeInput = z.infer<
  typeof assignPermanentFreeInputSchema
>

export const issueTrialGrantInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  amount: z.number().int().positive(),
  unit: entitlementExtensionDurationUnitSchema,
})

export const adjustTrialGrantInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  amount: z.number().int().positive(),
  unit: entitlementExtensionDurationUnitSchema,
  direction: entitlementExtensionDirectionSchema.default('extend'),
})

export const revokeTrialGrantInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
})

export type IssueTrialGrantInput = z.infer<typeof issueTrialGrantInputSchema>

export type AdjustTrialGrantInput = z.infer<typeof adjustTrialGrantInputSchema>

export type RevokeTrialGrantInput = z.infer<typeof revokeTrialGrantInputSchema>
