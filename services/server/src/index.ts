import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { auth } from '@virtality/auth'
import type { AuthContext } from '@virtality/auth'

import { authMiddleware } from './middleware/auth.ts'
import { orpcMiddleware } from './middleware/orpc.ts'
import { findDeviceByDeviceId } from './data/device.ts'
import { ORPC_PREFIX } from '@virtality/shared/types'

const app = new Hono<AppContext>()

app.use(logger())

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

app.use(`${ORPC_PREFIX}/*`, authMiddleware, orpcMiddleware)

if (process.env.NODE_ENV !== 'production') {
  serve({ fetch: app.fetch, port: 8080, hostname: '0.0.0.0' })
}

export default app

export type AppContext = { Variables: AuthContext }
