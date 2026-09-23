import { Hono } from 'hono'
import type { AppLogger } from '@virtality/shared/observability'
import { verifyWebhookSignature } from './whatsapp/signature.ts'
import {
  extractIncomingMessages,
  type IncomingMessage,
} from './whatsapp/webhook-payload.ts'

export type AppDeps = {
  verifyToken: string
  appSecret: string
  onMessage: (message: IncomingMessage) => Promise<void>
  /**
   * Keeps work alive after the response is sent. Node: fire and forget.
   * Workers: `executionCtx.waitUntil`.
   */
  runInBackground: (task: Promise<void>) => void
  logger: Pick<AppLogger, 'warn' | 'error'>
}

// Kept free of Node APIs so a Workers entry can reuse it unchanged.
export function createApp(deps: AppDeps) {
  const app = new Hono()

  app.get('/health', (c) => c.text('ok'))

  // Meta calls this once when the webhook URL is saved in the App Dashboard.
  app.get('/webhook', (c) => {
    const mode = c.req.query('hub.mode')
    const token = c.req.query('hub.verify_token')
    const challenge = c.req.query('hub.challenge')

    if (mode === 'subscribe' && token === deps.verifyToken && challenge) {
      return c.text(challenge)
    }

    return c.text('Forbidden', 403)
  })

  app.post('/webhook', async (c) => {
    const rawBody = await c.req.text()
    const isSigned = await verifyWebhookSignature(
      rawBody,
      c.req.header('x-hub-signature-256'),
      deps.appSecret,
    )

    if (!isSigned) {
      deps.logger.warn('team_bot.webhook.bad_signature')
      return c.text('Unauthorized', 401)
    }

    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return c.text('Bad Request', 400)
    }

    // Meta retries any delivery that is not acknowledged quickly, so answer
    // first and talk to Linear afterwards.
    for (const message of extractIncomingMessages(payload)) {
      deps.runInBackground(
        deps.onMessage(message).catch((error: unknown) => {
          deps.logger.error('team_bot.message.failed', {
            messageId: message.id,
            error,
          })
        }),
      )
    }

    return c.text('OK')
  })

  return app
}
