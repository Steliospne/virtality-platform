import { z } from 'zod/v4'
import type { PrismaClient } from '@virtality/db'
import { isValidPassword } from '@virtality/shared/utils'
import { getConsoleUrl } from '@virtality/shared/types'
import { sendPendingPasswordChange } from '@virtality/nodemailer'
import { authed } from '../../middleware/auth.ts'
import { base } from '../../context.ts'
import {
  approvePendingPasswordSetup,
  createPendingPasswordSetup,
  getActivePendingPasswordChange,
  inspectPendingPasswordChange,
} from './pending-password-change.ts'

const StartSetupInputSchema = z.object({
  newPassword: z.string().trim().check(isValidPassword),
})

const TokenInputSchema = z.object({
  token: z.string().trim().min(1),
})

const baseURL = getConsoleUrl()

const pendingPasswordChangeDeps = (prisma: PrismaClient) => ({
  pendingPasswordChange: prisma.pendingPasswordChange,
  account: prisma.account,
  session: prisma.session,
})

const startSetup = authed
  .route({ path: '/pending-password-change/start-setup', method: 'POST' })
  .input(StartSetupInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma, user, session } = context

    const result = await createPendingPasswordSetup(
      pendingPasswordChangeDeps(prisma),
      {
        userId: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        newPassword: input.newPassword,
        initiatingSessionId: session.id,
      },
      async ({ email, name, approvalUrl }) => {
        await sendPendingPasswordChange({
          user: {
            id: user.id,
            email,
            name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          url: approvalUrl,
          variant: 'setup',
        })
      },
      (token) =>
        `${baseURL}/password-setup/confirm?token=${encodeURIComponent(token)}`,
    )

    return result
  })

const getActive = authed
  .route({ path: '/pending-password-change/active', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma, user } = context

    return getActivePendingPasswordChange(
      { pendingPasswordChange: prisma.pendingPasswordChange },
      user.id,
    )
  })

const inspect = base
  .route({ path: '/pending-password-change/inspect', method: 'POST' })
  .input(TokenInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    return inspectPendingPasswordChange(
      pendingPasswordChangeDeps(prisma),
      input.token,
    )
  })

const approve = base
  .route({ path: '/pending-password-change/approve', method: 'POST' })
  .input(TokenInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    return approvePendingPasswordSetup(
      pendingPasswordChangeDeps(prisma),
      input.token,
    )
  })

export const pendingPasswordChange = {
  startSetup,
  getActive,
  inspect,
  approve,
}
