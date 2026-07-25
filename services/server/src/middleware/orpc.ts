import { orpcHandler } from '@virtality/orpc/server'
import { createMiddleware } from 'hono/factory'
import type { AppContext } from '../index.ts'
import { prisma } from '@virtality/db'
import { virtalityS3 } from '@virtality/orpc/s3'
import { ORPC_PREFIX } from '@virtality/shared/types'
import { revalidateWebsiteMarketingCache } from '../lib/revalidate-website-marketing.ts'

export const orpcMiddleware = createMiddleware<AppContext>(async (c, next) => {
  const { matched, response } = await orpcHandler.handle(c.req.raw, {
    prefix: ORPC_PREFIX,
    context: {
      prisma,
      headers: c.req.raw.headers,
      request: c.req.raw,
      user: c.var.user,
      session: c.var.session,
      s3: virtalityS3,
      revalidateWebsiteMarketingCache,
    },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  await next()
})
