import type { PrismaClient } from '@virtality/db'
import {
  rearmRenewPromptEpoch,
  rearmRenewPromptEpochForSubscription,
  rearmRenewPromptEpochIfClockChanged,
  type RenewPromptDeliveryStore,
  type RenewPromptSubscriptionClock,
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

function deliveryStore(client: PrismaClient) {
  return createPrismaRenewPromptDeliveryStore(client)
}

/** Drop prior-epoch renew backlog for a known new live clock end. */
export async function rearmRenewPromptsForNewClockEnd(
  client: PrismaClient,
  input: { userId: string; clockEnd: Date },
) {
  return rearmRenewPromptEpoch(deliveryStore(client), input)
}

/** Extension path: re-arm only when the Entitlement Clock end changed. */
export async function rearmRenewPromptsAfterExtension(
  client: PrismaClient,
  input: {
    userId: string
    previousClockEnd: Date | null
    nextClockEnd: Date
  },
) {
  return rearmRenewPromptEpochIfClockChanged(deliveryStore(client), input)
}

/**
 * Successful Subscribe/Renew Checkout (or live subscription sync): re-arm to
 * the subscription's live clock end and drop prior-epoch backlog.
 */
export async function rearmRenewPromptsAfterCheckoutSubscription(
  client: PrismaClient,
  subscription: RenewPromptSubscriptionClock,
) {
  return rearmRenewPromptEpochForSubscription(
    deliveryStore(client),
    subscription,
  )
}
