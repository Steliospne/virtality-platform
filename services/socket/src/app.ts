import { Server, ServerOptions } from 'socket.io'
import express from 'express'
import { createServer } from 'http'
import { CONNECTION_EVENT } from '@virtality/shared/types'
import {
  createAppLogger,
  shutdownObservability,
} from '@virtality/shared/observability'
import { createRoleSlotRoomRegistry } from './domain/role-slot-room-registry'
import { createServerDeviceController } from './sockets/server-device-controller'

const CLEANUP_INTERVAL_MS = 30 * 60 * 1000
const SNAPSHOT_INTERVAL_MS = 0.5 * 60 * 1000

// Initialize Socket.IO
const app = express()
const logger = createAppLogger({
  serviceName: 'socket',
  defaultAttributes: {
    runtime: 'socket.io',
  },
})

const httpServer = createServer(app)

logger.info('service.bootstrap', {
  env: process.env.ENV ?? 'development',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  simulationEnabled: process.env.SIM === 'true',
})

const socketOptions = {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://console.virtality.app',
      'https://preview-console.virtality.app',
    ],
  },
} satisfies Partial<ServerOptions>

const io = new Server(httpServer, socketOptions)

app.get('/warmup', (_req, res) => {
  void io.engine
  logger.info('http.warmup.ok', {
    route: '/warmup',
  })
  res.status(200).send('ok')
})

const PORT = process.env.PORT || '8081'

// Composition root: one registry, one controller, timers owned here.
const registry = createRoleSlotRoomRegistry()
const controller = createServerDeviceController({
  registry,
  simulation: process.env.SIM === 'true',
})
io.on(CONNECTION_EVENT.CONNECTION, controller.connectionHandler)

const cleanupTimer = setInterval(
  () => controller.runStaleRoomCleanup(),
  CLEANUP_INTERVAL_MS,
)
const snapshotTimer = setInterval(
  () => controller.logRoomSnapshot(),
  SNAPSHOT_INTERVAL_MS,
)

const httpServerOptions =
  process.env.NODE_ENV !== 'production'
    ? { port: PORT, host: '0.0.0.0' }
    : { port: PORT }

httpServer.listen(httpServerOptions, () => {
  logger.info('service.start', {
    port: PORT,
    host: process.env.NODE_ENV !== 'production' ? '0.0.0.0' : 'default',
  })
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    logger.info('service.shutdown', {
      signal,
      service: 'socket',
    })

    clearInterval(cleanupTimer)
    clearInterval(snapshotTimer)
    io.close(() => {
      void shutdownObservability().finally(() => {
        process.exit(0)
      })
    })
  })
}
