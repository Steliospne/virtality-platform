import { authed } from '../middleware/auth.ts'

export const me = authed
  .route({ path: '/me', method: 'GET' })
  .handler(async ({ context }) => {
    return { user: context.user, session: context.session }
  })
