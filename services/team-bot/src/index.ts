import { serve } from '@hono/node-server'
import {
  createAppLogger,
  shutdownObservability,
} from '@virtality/shared/observability'

import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { handleIncomingMessage } from './handle-message.ts'
import { createLinearClient } from './linear/client.ts'
import { createSeenMessages } from './seen-messages.ts'
import { createWhatsAppClient } from './whatsapp/client.ts'

const config = loadConfig(process.env)
const logger = createAppLogger({ serviceName: 'team-bot' })

const deps = {
  phoneNumberId: config.whatsapp.phoneNumberId,
  allowedSenders: config.allowedSenders,
  seenMessages: createSeenMessages(),
  linear: createLinearClient(config.linear),
  whatsapp: createWhatsAppClient(config.whatsapp),
  logger,
}

// Messages still being handled when the container stops; shutdown waits for
// them so a deploy does not drop an issue halfway through.
const inFlight = new Set<Promise<void>>()

const app = createApp({
  verifyToken: config.whatsapp.verifyToken,
  appSecret: config.whatsapp.appSecret,
  onMessage: (message) => handleIncomingMessage(message, deps),
  runInBackground: (task) => {
    inFlight.add(task)
    void task.finally(() => inFlight.delete(task))
  },
  logger,
})

const server = serve({
  fetch: app.fetch,
  port: config.port,
  hostname: '0.0.0.0',
})

logger.info('service.start', {
  port: config.port,
  env: config.env,
  allowedSenders: config.allowedSenders.size,
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    logger.debug('service.shutdown', { signal, service: 'team-bot' })
    server.close()
    void Promise.allSettled(inFlight)
      .finally(() => shutdownObservability())
      .finally(() => process.exit(0))
  })
}
