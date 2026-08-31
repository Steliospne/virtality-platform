import { z } from 'zod/v4'
import type { PrismaClient } from '@virtality/db'
import { getConsoleUrl } from '@virtality/shared/types'
import { sendPendingAccountDeletion } from '@virtality/nodemailer'
import { authed } from '../../middleware/auth.ts'
import { base } from '../../context.ts'
import {
  approvePendingAccountDeletion,
  cancelPendingAccountDeletion,
  createPendingAccountDeletion,
  getActivePendingAccountDeletion,
  inspectPendingAccountDeletion,
  resendPendingAccountDeletion,
  type ApprovalEmailData,
} from './pending-account-deletion.ts'

const TokenInputSchema = z.object({
  token: z.string().trim().min(1),
})

const baseURL = getConsoleUrl()

const pendingAccountDeletionDeps = (prisma: PrismaClient) => ({
  pendingAccountDeletion: prisma.pendingAccountDeletion,
  user: prisma.user,
  session: prisma.session,
})

const pendingAccountDeletionReadDeps = (prisma: PrismaClient) => ({
  pendingAccountDeletion: prisma.pendingAccountDeletion,
})

const buildApprovalUrl = (token: string) =>
  `${baseURL}/delete-account/confirm?token=${encodeURIComponent(token)}`

const sendApprovalEmail =
  (user: {
    id: string
    email: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  }) =>
  async (data: ApprovalEmailData) => {
    const { email, name, approvalUrl } = data
    await sendPendingAccountDeletion({
      user: {
        id: user.id,
        email,
        name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      url: approvalUrl,
    })
  }

const start = authed
  .route({ path: '/pending-account-deletion/start', method: 'POST' })
  .handler(async ({ context }) => {
    const { prisma, user, session } = context

    return createPendingAccountDeletion(
      pendingAccountDeletionDeps(prisma),
      {
        userId: user.id,
        email: user.email,
        initiatingSessionId: session.id,
      },
      sendApprovalEmail(user),
      buildApprovalUrl,
    )
  })

const getActive = authed
  .route({ path: '/pending-account-deletion/active', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma, user } = context

    return getActivePendingAccountDeletion(
      pendingAccountDeletionReadDeps(prisma),
      user.id,
    )
  })

const resend = authed
  .route({ path: '/pending-account-deletion/resend', method: 'POST' })
  .handler(async ({ context }) => {
    const { prisma, user } = context

    return resendPendingAccountDeletion(
      pendingAccountDeletionDeps(prisma),
      user.id,
      sendApprovalEmail(user),
      buildApprovalUrl,
    )
  })

const cancel = authed
  .route({ path: '/pending-account-deletion/cancel', method: 'POST' })
  .handler(async ({ context }) => {
    const { prisma, user } = context

    return cancelPendingAccountDeletion(
      pendingAccountDeletionReadDeps(prisma),
      user.id,
    )
  })

const inspect = base
  .route({ path: '/pending-account-deletion/inspect', method: 'POST' })
  .input(TokenInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma, user } = context

    return inspectPendingAccountDeletion(
      pendingAccountDeletionDeps(prisma),
      input.token,
      user?.id,
    )
  })

const approve = base
  .route({ path: '/pending-account-deletion/approve', method: 'POST' })
  .input(TokenInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const result = await approvePendingAccountDeletion(
      pendingAccountDeletionDeps(prisma),
      input.token,
    )

    return { approved: result.approved }
  })

export const pendingAccountDeletion = {
  start,
  getActive,
  resend,
  cancel,
  inspect,
  approve,
}
