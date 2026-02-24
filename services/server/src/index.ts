import { auth } from '@virtality/auth'
import { Hono } from 'hono'
import { authMiddleware } from './middleware/auth.ts'
import { cors } from 'hono/cors'
import { ORPC_PREFIX } from '@virtality/orpc'

import type { AuthContext } from '@virtality/auth'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { orpcMiddleware } from './middleware/orpc.ts'

const app = new Hono<AppContext>()

app.use(logger())

app.use(
  cors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'https://preview-console.virtality.app',
    ], // replace with your origin
    allowHeaders: ['Content-Type', 'Authorization', 'trpc-accept'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

app.use('/api/v1/auth/*', authMiddleware)

app.on(['GET', 'POST'], '/api/v1/auth/*', (c) => auth.handler(c.req.raw))

app.use(`${ORPC_PREFIX}/*`, authMiddleware, orpcMiddleware)

if (process.env.NODE_ENV !== 'production') {
  serve({ fetch: app.fetch, port: 8080, hostname: '0.0.0.0' })
}

export default app

export type AppContext = { Variables: AuthContext }
