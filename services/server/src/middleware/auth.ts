import { auth } from '@virtality/auth'
import { createMiddleware } from 'hono/factory'
import type { AppContext } from '../index.ts'

export const authMiddleware = createMiddleware<AppContext>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    c.set('session', null)
    c.set('user', null)
    return await next()
  }

  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})
