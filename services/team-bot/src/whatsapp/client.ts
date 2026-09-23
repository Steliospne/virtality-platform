const REQUEST_TIMEOUT_MS = 10_000

export type WhatsAppClient = {
  replyText: (input: {
    to: string
    body: string
    replyToMessageId: string
  }) => Promise<void>
}

export function createWhatsAppClient(options: {
  accessToken: string
  phoneNumberId: string
  graphApiVersion: string
  fetch?: typeof fetch
}): WhatsAppClient {
  const fetchImpl = options.fetch ?? fetch
  const url = `https://graph.facebook.com/${options.graphApiVersion}/${options.phoneNumberId}/messages`

  return {
    async replyText({ to, body, replyToMessageId }) {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          // Quotes the sender's message so the reply reads as an answer to it.
          context: { message_id: replyToMessageId },
          text: { body, preview_url: false },
        }),
      })

      if (!response.ok) {
        throw new Error(
          `WhatsApp send failed (${response.status}): ${await response.text()}`,
        )
      }
    },
  }
}
