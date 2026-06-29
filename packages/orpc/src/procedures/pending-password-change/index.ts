import { z } from 'zod/v4'
import type { PrismaClient } from '@virtality/db'
import { isValidPassword } from '@virtality/shared/utils'
import { getConsoleUrl } from '@virtality/shared/types'
import { sendPendingPasswordChange } from '@virtality/nodemailer'
import { authed } from '../../middleware/auth.ts'
import { base } from '../../context.ts'
import {
  approvePendingPasswordChange,
  cancelPendingPasswordChange,
  createPendingPasswordChange,
  createPendingPasswordSetup,
  getActivePendingPasswordChange,
  inspectPendingPasswordChange,
  resendPendingPasswordChange,
  type ApprovalEmailData,
  type PendingPasswordChangeKind,
} from './pending-password-change.ts'

const StartSetupInputSchema = z.object({
  newPassword: z.string().trim().check(isValidPassword),
})

const StartChangeInputSchema = z.object({
  currentPassword: z.string().trim().min(1),
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

const pendingPasswordChangeReadDeps = (prisma: PrismaClient) => ({
  pendingPasswordChange: prisma.pendingPasswordChange,
})

const buildApprovalUrl = (token: string) =>
  `${baseURL}/password-setup/confirm?token=${encodeURIComponent(token)}`

const emailVariantForKind = (kind: PendingPasswordChangeKind) =>
  kind === 'SETUP' ? 'setup' : 'change'

const sendApprovalEmail =
  (user: {
    id: string
    email: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  }) =>
  async (data: ApprovalEmailData) => {
    const { email, name, approvalUrl, kind } = data
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
      variant: emailVariantForKind(kind),
    })
  }

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
      sendApprovalEmail(user),
      buildApprovalUrl,
    )

    return result
  })

const startChange = authed
  .route({ path: '/pending-password-change/start-change', method: 'POST' })
  .input(StartChangeInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma, user, session } = context

    const result = await createPendingPasswordChange(
      pendingPasswordChangeDeps(prisma),
      {
        userId: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        initiatingSessionId: session.id,
      },
      sendApprovalEmail(user),
      buildApprovalUrl,
    )

    return result
  })

const getActive = authed
  .route({ path: '/pending-password-change/active', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma, user } = context

    return getActivePendingPasswordChange(
      pendingPasswordChangeReadDeps(prisma),
      user.id,
    )
  })

const resend = authed
  .route({ path: '/pending-password-change/resend', method: 'POST' })
  .handler(async ({ context }) => {
    const { prisma, user } = context

    return resendPendingPasswordChange(
      pendingPasswordChangeDeps(prisma),
      user.id,
      sendApprovalEmail(user),
      buildApprovalUrl,
    )
  })

const cancel = authed
  .route({ path: '/pending-password-change/cancel', method: 'POST' })
  .handler(async ({ context }) => {
    const { prisma, user } = context

    return cancelPendingPasswordChange(
      pendingPasswordChangeReadDeps(prisma),
      user.id,
    )
  })

const inspect = base
  .route({ path: '/pending-password-change/inspect', method: 'POST' })
  .input(TokenInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma, user } = context

    return inspectPendingPasswordChange(
      pendingPasswordChangeDeps(prisma),
      input.token,
      user?.id,
    )
  })

const approve = base
  .route({ path: '/pending-password-change/approve', method: 'POST' })
  .input(TokenInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    return approvePendingPasswordChange(
      pendingPasswordChangeDeps(prisma),
      input.token,
    )
  })

export const pendingPasswordChange = {
  startSetup,
  startChange,
  getActive,
  resend,
  cancel,
  inspect,
  approve,
}
