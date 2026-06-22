import { Server, ServerOptions } from 'socket.io'
import express from 'express'
import { createServer } from 'http'
import { CONNECTION_EVENT } from '@virtality/shared/types'
import {
  createAppLogger,
  shutdownObservability,
} from '@virtality/shared/observability'
import { connectionHandler } from './sockets/device-event-controller'
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

// Socket.IO connection handler
io.on(CONNECTION_EVENT.CONNECTION, (socket) => connectionHandler(socket))

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

    io.close(() => {
      void shutdownObservability().finally(() => {
        process.exit(0)
      })
    })
  })
}
