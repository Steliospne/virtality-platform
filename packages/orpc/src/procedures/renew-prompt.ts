import { createRenewPromptLifecycle } from '@virtality/auth'
import type { PrismaClient } from '@virtality/db'
import { sendRenewPromptEmail } from '@virtality/nodemailer'
import { getConsoleUrl } from '@virtality/shared/types'
import {
  renewPromptEpochKey,
  type EntitlementClockStanding,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { loadEntitlementStandingForSession } from './entitlement-clock.ts'

function standingEpochKey(
  standing: Pick<EntitlementClockStanding, 'clockEnd'>,
): string | null {
  return standing.clockEnd ? renewPromptEpochKey(standing.clockEnd) : null
}

async function loadStandingForUser(
  prisma: PrismaClient,
  user: {
    id: string
    role?: string | null
    stripeCustomerId?: string | null
  },
) {
  return loadEntitlementStandingForSession({
    prisma,
    userId: user.id,
    role: user.role,
    stripeCustomerId: user.stripeCustomerId,
  })
}

/** Evaluate path: wires System Email to Profile Billing. */
function renewPromptLifecycleWithEmail(
  prisma: PrismaClient,
  user: { id: string; email: string },
) {
  const consoleBase = getConsoleUrl().replace(/\/$/, '')
  const billingUrl = `${consoleBase}/user/${user.id}/profile?tab=billing`

  return createRenewPromptLifecycle({
    prisma,
    deliverEmail: async ({ recipientEmail, daysBefore, clockEnd }) => {
      await sendRenewPromptEmail({
        recipientEmail,
        daysBefore,
        clockEnd,
        actionUrl: billingUrl,
      })
    },
  })
}

const evaluate = authed
  .route({ path: '/renew-prompt/evaluate', method: 'POST' })
  .handler(async ({ context }) => {
    const standing = await loadStandingForUser(context.prisma, context.user)
    const lifecycle = renewPromptLifecycleWithEmail(
      context.prisma,
      context.user,
    )

    const { delivered } = await lifecycle.evaluateSeat({
      userId: context.user.id,
      recipientEmail: context.user.email,
      standing,
    })

    const inApp = await lifecycle.listInApp({
      userId: context.user.id,
      standing,
    })

    return {
      delivered,
      inApp,
      entitled: standing.entitled,
      epochKey: standingEpochKey(standing),
    }
  })

const listInApp = authed
  .route({ path: '/renew-prompt/list-in-app', method: 'GET' })
  .handler(async ({ context }) => {
    const standing = await loadStandingForUser(context.prisma, context.user)
    const inApp = await createRenewPromptLifecycle({
      prisma: context.prisma,
    }).listInApp({
      userId: context.user.id,
      standing,
    })

    return {
      inApp,
      entitled: standing.entitled,
      epochKey: standingEpochKey(standing),
    }
  })

export const renewPrompt = {
  evaluate,
  listInApp,
}
