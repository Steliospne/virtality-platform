import type { PrismaClient } from '@virtality/db'
import { sendRenewPromptEmail } from '@virtality/nodemailer'
import { getConsoleUrl } from '@virtality/shared/types'
import { generateUUID } from '@virtality/shared/utils'
import {
  evaluateAndDeliverRenewPrompts,
  listInAppRenewPromptsForSeat,
  renewPromptEpochKey,
  type EntitlementClockStanding,
  type RenewPromptDeliveryStore,
} from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { loadEntitlementStandingForSession } from './entitlement-clock.ts'
import { createPrismaRenewTriggerStore } from './renew-trigger.ts'

export function createPrismaRenewPromptDeliveryStore(
  prisma: PrismaClient,
): RenewPromptDeliveryStore {
  return {
    listForUserAndEpoch: (userId, epochKey) =>
      prisma.renewPromptDelivery.findMany({
        where: { userId, epochKey },
      }),
    create: (data) => prisma.renewPromptDelivery.create({ data }),
  }
}

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

const evaluate = authed
  .route({ path: '/renew-prompt/evaluate', method: 'POST' })
  .handler(async ({ context }) => {
    const standing = await loadStandingForUser(context.prisma, context.user)
    const deliveries = createPrismaRenewPromptDeliveryStore(context.prisma)
    const consoleUrl = getConsoleUrl()

    const { delivered } = await evaluateAndDeliverRenewPrompts(
      {
        triggers: createPrismaRenewTriggerStore(context.prisma),
        deliveries,
      },
      {
        generateId: generateUUID,
        deliverEmail: async ({ recipientEmail, daysBefore, clockEnd }) => {
          await sendRenewPromptEmail({
            recipientEmail,
            daysBefore,
            clockEnd,
            consoleUrl,
          })
        },
      },
      {
        userId: context.user.id,
        recipientEmail: context.user.email,
        standing,
      },
    )

    const inApp = await listInAppRenewPromptsForSeat(deliveries, {
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

    const inApp = await listInAppRenewPromptsForSeat(
      createPrismaRenewPromptDeliveryStore(context.prisma),
      {
        userId: context.user.id,
        standing,
      },
    )

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
