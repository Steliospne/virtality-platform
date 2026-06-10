import { z } from 'zod'
import { emailBodyBlocksSchema } from './admin-email.js'

export const renderedEmailSnapshotSchema = z.object({
  subject: z.string(),
  html: z.string(),
  previewText: z.string().optional(),
})

export type RenderedEmailSnapshot = z.infer<typeof renderedEmailSnapshotSchema>

export const adminEmailDeliveryStatusSchema = z.enum(['sent', 'failed'])

export type AdminEmailDeliveryStatus = z.infer<
  typeof adminEmailDeliveryStatusSchema
>

export const adminEmailDeliveryResultSchema = z.object({
  recipientEmail: z.string(),
  status: adminEmailDeliveryStatusSchema,
  errorMessage: z.string().optional(),
  attemptedAt: z.coerce.date(),
})

export type AdminEmailDeliveryResult = z.infer<
  typeof adminEmailDeliveryResultSchema
>

export const storedEmailBodyBlocksSchema = emailBodyBlocksSchema
