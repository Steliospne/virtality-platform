import type { PrismaClient } from '@virtality/db'
import {
  rearmRenewPromptEpoch,
  rearmRenewPromptEpochForSubscription,
  rearmRenewPromptEpochIfClockChanged,
  type RenewPromptDeliveryStore,
} from '@virtality/shared/utils'

export function createPrismaRenewPromptDeliveryStore(
  client: PrismaClient,
): RenewPromptDeliveryStore {
  return {
    listForUserAndEpoch: (userId, epochKey) =>
      client.renewPromptDelivery.findMany({
        where: { userId, epochKey },
      }),
    create: (data) => client.renewPromptDelivery.create({ data }),
    deleteOutsideEpoch: async (userId, epochKey) => {
      const result = await client.renewPromptDelivery.deleteMany({
        where: {
          userId,
          epochKey: { not: epochKey },
        },
      })
      return result.count
    },
  }
}

/** Drop prior-epoch renew backlog for a known new live clock end. */
export async function rearmRenewPromptsForNewClockEnd(
  client: PrismaClient,
  input: { userId: string; clockEnd: Date },
) {
  return rearmRenewPromptEpoch(
    createPrismaRenewPromptDeliveryStore(client),
    input,
  )
}

/**
 * Extension path: re-arm only when the Entitlement Clock end changed.
 */
export async function rearmRenewPromptsAfterExtension(
  client: PrismaClient,
  input: {
    userId: string
    previousClockEnd: Date | null
    nextClockEnd: Date
  },
) {
  return rearmRenewPromptEpochIfClockChanged(
    createPrismaRenewPromptDeliveryStore(client),
    {
      userId: input.userId,
      previousClockEnd: input.previousClockEnd,
      nextClockEnd: input.nextClockEnd,
    },
  )
}

/**
 * Successful Subscribe/Renew Checkout (or live subscription sync): re-arm to
 * the subscription's live clock end and drop prior-epoch backlog.
 */
export async function rearmRenewPromptsAfterCheckoutSubscription(
  client: PrismaClient,
  subscription: {
    referenceId: string
    status: string
    trialEnd?: Date | null
    periodEnd?: Date | null
  },
) {
  return rearmRenewPromptEpochForSubscription(
    createPrismaRenewPromptDeliveryStore(client),
    subscription,
  )
}
