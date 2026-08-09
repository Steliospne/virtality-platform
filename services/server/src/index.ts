import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { auth } from '@virtality/auth'
import type { AuthContext } from '@virtality/auth'
import {
  createAppLogger,
  createRequestId,
  shutdownObservability,
} from '@virtality/shared/observability'

import { authMiddleware } from './middleware/auth.ts'
import { orpcMiddleware } from './middleware/orpc.ts'
import { findDeviceByDeviceId } from './data/device.ts'
import { ORPC_PREFIX } from '@virtality/shared/types'
import { devicePairingRoutes } from './routes/device-pairing.ts'

const ENV =
  process.env.ENV === 'production'
    ? 'production'
    : process.env.ENV === 'preview'
      ? 'preview'
      : 'development'

const TOKEN_ID = process.env.CLOUDFLARE_TURN_TOKEN_ID
const API_TOKEN = process.env.CLOUDFLARE_TURN_API_TOKEN
const ttl = Number(process.env.CLOUDFLARE_TURN_TTL_SECONDS ?? 86400)

if (!TOKEN_ID || !API_TOKEN) {
  throw new Error(
    'CLOUDFLARE_TURN_TOKEN_ID and CLOUDFLARE_TURN_API_TOKEN must be set',
  )
}

const app = new Hono<AppContext>()
const logger = createAppLogger({
  serviceName: 'server',
  defaultAttributes: {
    runtime: 'hono',
  },
})
const httpLogger = logger.child({
  component: 'http',
})

app.use('*', async (c, next) => {
  const startedAt = Date.now()
  const requestId = c.req.header('x-request-id') ?? createRequestId()

  c.set('requestId', requestId)
  c.header('x-request-id', requestId)

  try {
    await next()

    httpLogger.info('http.request.completed', {
      requestId,
      method: c.req.method,
      path: c.req.path,
      statusCode: c.res.status,
      durationMs: Date.now() - startedAt,
      userAgent: c.req.header('user-agent') ?? 'unknown',
    })
  } catch (error) {
    httpLogger.error(
      'http.request.failed',
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        durationMs: Date.now() - startedAt,
        error,
      },
      'Unhandled request error',
    )
    throw error
  }
})

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://virtality.app',
      'https://www.virtality.app',
      'https://preview-web.virtality.app',
      'https://admin.virtality.app',
      'https://preview-admin.virtality.app',
      'https://console.virtality.app',
      'https://preview-console.virtality.app',
    ], // replace with your origin
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

app.use('/api/v1/auth/*', authMiddleware)

app.on(['GET', 'POST'], '/api/v1/auth/*', (c) => auth.handler(c.req.raw))

// Legacy route for VR deviceId check
app.use('/api/v1/devices/:deviceId', async (c) => {
  const { deviceId } = c.req.param()

  const device = await findDeviceByDeviceId(deviceId)

  if (!device) {
    return c.json(null)
  }

  return c.json({ device })
})

app.route('/api/v1/device-pairing', devicePairingRoutes)

app.use(`${ORPC_PREFIX}/*`, authMiddleware, orpcMiddleware)

app.use('/api/casting/ice-servers', authMiddleware, async (c) => {
  try {
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${TOKEN_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl }),
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      return c.json(
        { error: 'Failed to generate casting ICE servers' },
        { status: 502 },
      )
    }

    const data = (await response.json()) as {
      iceServers?: RTCIceServer[]
    }

    if (!Array.isArray(data.iceServers) || data.iceServers.length === 0) {
      return c.json(
        { error: 'Cloudflare returned no ICE servers' },
        { status: 502 },
      )
    }

    return c.json(
      { iceServers: data.iceServers },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch {
    return c.json(
      { error: 'Failed to generate casting ICE servers' },
      { status: 502 },
    )
  }
})

let server: ReturnType<typeof serve> | undefined

if (ENV === 'development' || process.env.LISTEN === 'true') {
  logger.info('service.start', {
    host: '0.0.0.0',
    port: 8080,
    mode: 'node-server',
    env: ENV,
  })
  server = serve({ fetch: app.fetch, port: 8080, hostname: '0.0.0.0' })
}

export default app

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    logger.info('service.shutdown', { signal, service: 'server' })
    const closeServer = () =>
      new Promise<void>((resolve) => {
        if (!server) return resolve()
        server.close(() => resolve())
      })
    void closeServer()
      .finally(() => shutdownObservability())
      .finally(() => process.exit(0))
  })
}

export type AppContext = {
  Variables: AuthContext & {
    requestId: string
  }
}
