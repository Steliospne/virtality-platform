import { z } from 'zod'

export const entitlementExtensionDurationUnitSchema = z.enum([
  'days',
  'weeks',
  'months',
])

export type EntitlementExtensionDurationUnitInput = z.infer<
  typeof entitlementExtensionDurationUnitSchema
>

export const extendEntitlementClockInputSchema = z.object({
  userId: z.string().trim().min(1),
  amount: z.number().int().positive(),
  unit: entitlementExtensionDurationUnitSchema,
})

export type ExtendEntitlementClockInput = z.infer<
  typeof extendEntitlementClockInputSchema
>

export type ExtendableSeatSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'expired'
  | 'never_entitled'

export type ExtendableSeatListItem = {
  userId: string
  name: string
  email: string
  subscriptionStatus: ExtendableSeatSubscriptionStatus
  stripeSubscriptionId: string | null
  clockEnd: Date | null
  extensionMode: 'update' | 'create'
}
