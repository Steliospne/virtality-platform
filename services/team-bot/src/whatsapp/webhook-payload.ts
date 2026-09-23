import { z } from 'zod/v4'

// Only the fields the bot reads. Meta adds fields over time; zod strips them.
const WebhookPayloadSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            metadata: z.object({ phone_number_id: z.string() }),
            contacts: z
              .array(
                z.object({
                  wa_id: z.string(),
                  profile: z.object({ name: z.string() }).optional(),
                }),
              )
              .optional(),
            messages: z
              .array(
                z.object({
                  id: z.string(),
                  from: z.string(),
                  type: z.string(),
                  text: z.object({ body: z.string() }).optional(),
                }),
              )
              .optional(),
          }),
        }),
      ),
    }),
  ),
})

export type IncomingMessage = {
  id: string
  from: string
  senderName: string | undefined
  phoneNumberId: string
  type: string
  text: string | undefined
}

/**
 * Flattens a webhook delivery into the messages people sent. Delivery and
 * read receipts for the bot's own replies arrive as `statuses` on the same
 * field and are dropped here.
 */
export function extractIncomingMessages(payload: unknown): IncomingMessage[] {
  const parsed = WebhookPayloadSchema.safeParse(payload)
  if (!parsed.success) return []

  return parsed.data.entry.flatMap((entry) =>
    entry.changes
      .filter((change) => change.field === 'messages')
      .flatMap(({ value }) =>
        (value.messages ?? []).map((message) => ({
          id: message.id,
          from: message.from,
          senderName: value.contacts?.find(
            (contact) => contact.wa_id === message.from,
          )?.profile?.name,
          phoneNumberId: value.metadata.phone_number_id,
          type: message.type,
          text: message.text?.body,
        })),
      ),
  )
}
