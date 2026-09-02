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

export const issueTrialGrantInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  code: z.string().trim().min(1),
})

export const startTrialGrantInputSchema = z.object({
  userId: z.string().trim().min(1),
  reason: adminCustomerAccessReasonSchema,
  amount: z.number().int().positive(),
  unit: entitlementExtensionDurationUnitSchema,
})

export type IssueTrialGrantInput = z.infer<typeof issueTrialGrantInputSchema>

export type StartTrialGrantInput = z.infer<typeof startTrialGrantInputSchema>
