import { z } from 'zod'

export const DEFAULT_RENEW_TRIGGER_DAYS_BEFORE = [7, 3, 1] as const

export const renewTriggerChannelSchema = z.enum(['email', 'in_app'])

export type RenewTriggerChannel = z.infer<typeof renewTriggerChannelSchema>

export const listRenewTriggersInputSchema = z.object({
  channel: renewTriggerChannelSchema,
})

export type ListRenewTriggersInput = z.infer<
  typeof listRenewTriggersInputSchema
>

export const createRenewTriggerInputSchema = z.object({
  channel: renewTriggerChannelSchema,
  daysBefore: z.number().int().positive(),
  active: z.boolean().optional().default(true),
})

export type CreateRenewTriggerInput = z.infer<
  typeof createRenewTriggerInputSchema
>

export const updateRenewTriggerInputSchema = z.object({
  id: z.string().min(1),
  daysBefore: z.number().int().positive().optional(),
  active: z.boolean().optional(),
})

export type UpdateRenewTriggerInput = z.infer<
  typeof updateRenewTriggerInputSchema
>

export const removeRenewTriggerInputSchema = z.object({
  id: z.string().min(1),
})

export type RemoveRenewTriggerInput = z.infer<
  typeof removeRenewTriggerInputSchema
>

export type RenewTriggerListItem = {
  id: string
  channel: RenewTriggerChannel
  daysBefore: number
  active: boolean
}
