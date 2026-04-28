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

// Keepalive endpoint for cron (e.g. GitHub Actions) to prevent free tier sleep
app.get('/line', (_req, res) => {
  logger.debug('http.keepalive.ok', {
    route: '/line',
  })
  res.status(200).send('ok')
})

const httpServer = createServer(app)

logger.info('service.bootstrap', {
  env: process.env.ENV ?? 'development',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  simulationEnabled: process.env.SIM === 'true',
  coldStartSimulationEnabled: process.env.SOCKET_SIM_COLD_START === 'true',
  coldStartRejectAttempts: Number(
    process.env.SOCKET_SIM_COLD_START_REJECT_ATTEMPTS ?? 2,
  ),
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
const DEFAULT_COLD_START_REJECT_ATTEMPTS = 4
const isColdStartSimulationEnabled =
  process.env.SOCKET_SIM_COLD_START === 'true'
const coldStartRejectAttempts = Number(
  process.env.SOCKET_SIM_COLD_START_REJECT_ATTEMPTS ??
    DEFAULT_COLD_START_REJECT_ATTEMPTS,
)
const coldStartAttemptTracker = new Map<string, number>()
const coldStartCompletedKeys = new Set<string>()

const PORT = process.env.PORT || '8081'

httpServer.prependListener('request', (req, _res) => {
  if (!isColdStartSimulationEnabled || coldStartRejectAttempts <= 0) {
    return
  }

  const url = req.url ?? ''
  if (!url.startsWith('/socket.io/')) return

  const parsed = new URL(url, 'http://localhost')
  const isHandshakeRequest =
    parsed.searchParams.get('EIO') !== null &&
    parsed.searchParams.get('sid') === null
  if (!isHandshakeRequest) return

  const roomCode = parsed.searchParams.get('roomCode') ?? ''
  const agent = parsed.searchParams.get('agent') ?? 'unknown'
  const key = `${agent}:${roomCode || 'missing'}`
  if (coldStartCompletedKeys.has(key)) return

  const currentAttempt = (coldStartAttemptTracker.get(key) ?? 0) + 1
  console.log('currentAttempt', currentAttempt)
  if (currentAttempt <= coldStartRejectAttempts) {
    coldStartAttemptTracker.set(key, currentAttempt)
    logger.info('socket.cold_start.simulation.request_drop', {
      roomCode: roomCode || 'missing',
      agent,
      attempt: currentAttempt,
      rejectUntilAttempt: coldStartRejectAttempts,
      method: req.method ?? 'GET',
      path: parsed.pathname,
    })

    // Drop request at HTTP layer so the client experiences an unreachable server.
    req.socket.destroy()
    return
  }

  coldStartAttemptTracker.delete(key)
  coldStartCompletedKeys.add(key)
  console.log('from listener')
  logger.info('socket.cold_start.simulation.request_accept', {
    roomCode: roomCode || 'missing',
    agent,
    attempt: currentAttempt,
    method: req.method ?? 'GET',
    path: parsed.pathname,
  })
})

// Socket.IO connection handler
io.on(CONNECTION_EVENT.CONNECTION, (socket) => {
  if (isColdStartSimulationEnabled) {
    const roomCode =
      typeof socket.handshake.query.roomCode === 'string'
        ? socket.handshake.query.roomCode
        : ''
    const agent =
      typeof socket.handshake.query.agent === 'string'
        ? socket.handshake.query.agent
        : 'unknown'
    const key = `${agent}:${roomCode || 'missing'}`

    // Reset after a successful connection so future connect cycles
    // can simulate cold start again for the same key.
    console.log('coldStartCompletedKeys', coldStartCompletedKeys)
    coldStartCompletedKeys.delete(key)
    coldStartAttemptTracker.delete(key)
  }

  connectionHandler(socket)
})

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
