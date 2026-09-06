import { z } from 'zod'

export const entitlementExtensionDurationUnitSchema = z.enum([
  'days',
  'weeks',
  'months',
])

export type EntitlementExtensionDurationUnitInput = z.infer<
  typeof entitlementExtensionDurationUnitSchema
>

export const entitlementExtensionDirectionSchema = z.enum(['extend', 'reduce'])

export type EntitlementExtensionDirectionInput = z.infer<
  typeof entitlementExtensionDirectionSchema
>
