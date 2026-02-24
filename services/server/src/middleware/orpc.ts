import { orpcHandler, ORPC_PREFIX } from '@virtality/orpc'
import { createMiddleware } from 'hono/factory'
import type { AppContext } from '../index.ts'
import { prisma } from '@virtality/db'
import { virtalityS3 } from '@virtality/orpc/s3'

export const orpcMiddleware = createMiddleware<AppContext>(async (c, next) => {
  const { matched, response } = await orpcHandler.handle(c.req.raw, {
    prefix: `${ORPC_PREFIX}`,
    context: {
      prisma: prisma,
      headers: c.req.raw.headers,
      user: c.var.user,
      session: c.var.session,
      s3: virtalityS3,
    },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  await next()
})
