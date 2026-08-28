/**
 * Auth-side Renew Prompt runtime: evaluate, list-in-app, and rearm variants.
 * Pure offset/epoch rules stay in `@virtality/shared`; this wires Prisma stores
 * and an injected System Email send port (ADR-0003: not Stripe Billing mail).
 */

import type { PrismaClient } from '@virtality/db'
import {
  evaluateAndDeliverRenewPrompts,
  generateUUID,
  listInAppRenewPromptsForSeat,
  rearmRenewPromptEpoch,
  rearmRenewPromptEpochForSubscription,
  rearmRenewPromptEpochIfClockChanged,
  type DueRenewPrompt,
  type InAppRenewPrompt,
  type RearmRenewPromptEpochAttempt,
  type RearmRenewPromptEpochResult,
  type RenewPromptDeliveryStore,
  type RenewPromptEmailPayload,
  type RenewPromptSeat,
  type RenewPromptSubscriptionClock,
  type RenewTriggerStore,
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

export function createPrismaRenewTriggerStore(
  client: PrismaClient,
): RenewTriggerStore {
  return {
    findById: (id) =>
      client.renewTrigger.findUnique({
        where: { id },
      }),
    findByChannelAndDaysBefore: (channel, daysBefore) =>
      client.renewTrigger.findUnique({
        where: {
          channel_daysBefore: { channel, daysBefore },
        },
      }),
    create: (data) => client.renewTrigger.create({ data }),
    update: (id, data) =>
      client.renewTrigger.update({
        where: { id },
        data,
      }),
    deleteById: async (id) => {
      await client.renewTrigger.delete({
        where: { id },
      })
    },
    listByChannel: (channel) =>
      client.renewTrigger.findMany({
        where: { channel },
      }),
  }
}

export type RenewPromptLifecycleDeps = {
  prisma: PrismaClient
  /**
   * Virtality System Email delivery. Required for `evaluateSeat`.
   * Clock-changing rearm paths may omit it.
   */
  deliverEmail?: (payload: RenewPromptEmailPayload) => Promise<void>
  generateId?: () => string
  now?: () => Date
}

export type RenewPromptLifecycle = {
  evaluateSeat: (
    seat: RenewPromptSeat,
  ) => Promise<{ delivered: DueRenewPrompt[] }>
  listInApp: (
    seat: Pick<RenewPromptSeat, 'userId' | 'standing'>,
  ) => Promise<InAppRenewPrompt[]>
  rearmForNewClock: (input: {
    userId: string
    clockEnd: Date
  }) => Promise<RearmRenewPromptEpochResult>
  rearmAfterExtension: (input: {
    userId: string
    previousClockEnd: Date | null
    nextClockEnd: Date | null
  }) => Promise<RearmRenewPromptEpochAttempt>
  rearmAfterCheckout: (
    subscription: RenewPromptSubscriptionClock,
  ) => Promise<RearmRenewPromptEpochAttempt>
}

/**
 * Single auth seam for Renew Prompt evaluate, list-in-app, and all rearm
 * variants. Prisma delivery/trigger stores stay behind this factory.
 */
export function createRenewPromptLifecycle(
  deps: RenewPromptLifecycleDeps,
): RenewPromptLifecycle {
  const deliveries = createPrismaRenewPromptDeliveryStore(deps.prisma)
  const generateId = deps.generateId ?? generateUUID

  return {
    evaluateSeat(seat) {
      if (!deps.deliverEmail) {
        throw new Error(
          'Renew Prompt lifecycle: deliverEmail is required for evaluateSeat',
        )
      }
      const triggers = createPrismaRenewTriggerStore(deps.prisma)
      return evaluateAndDeliverRenewPrompts(
        { triggers, deliveries },
        {
          generateId,
          now: deps.now,
          deliverEmail: deps.deliverEmail,
        },
        seat,
      )
    },
    listInApp(seat) {
      return listInAppRenewPromptsForSeat(deliveries, seat)
    },
    rearmForNewClock(input) {
      return rearmRenewPromptEpoch(deliveries, input)
    },
    rearmAfterExtension(input) {
      return rearmRenewPromptEpochIfClockChanged(deliveries, input)
    },
    rearmAfterCheckout(subscription) {
      return rearmRenewPromptEpochForSubscription(deliveries, subscription)
    },
  }
}
