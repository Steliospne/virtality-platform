import { UserSchema } from '@virtality/db/definitions'
import { authed } from '../../middleware/auth.ts'
import { auth } from '@virtality/auth'
import { getConsoleUrl } from '@virtality/shared/types'

const baseURL = getConsoleUrl()

export const updateUserEmail = authed
  .route({ path: '/user/update-email', method: 'POST' })
  .input(UserSchema.pick({ email: true }))
  .handler(async ({ context, input }) => {
    const { user } = context

    await auth.api.changeEmail({
      headers: context.headers,
      request: context.request,
      body: {
        newEmail: input.email,
        callbackURL: `${baseURL}/change-email/pending?newEmail=${encodeURIComponent(input.email)}`,
      },
    })
  })
