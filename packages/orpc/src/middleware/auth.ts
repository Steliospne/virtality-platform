import { ORPCError } from '@orpc/server'
import { base } from '../context.ts'

/**
 * Middleware that requires `user` and `session` to be present in context
 * (injected by the server when calling handler.handle(), e.g. from auth.api.getSession).
 */
export const requireAuth = base.middleware(async ({ context, next }) => {
  if (context.user == null || context.session == null) {
    throw new ORPCError('UNAUTHORIZED')
  }
  return next({
    context: {
      user: context.user,
      session: context.session,
    },
  })
})

export const authed = base.use(requireAuth)
