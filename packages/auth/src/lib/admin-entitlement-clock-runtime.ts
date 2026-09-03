/**
 * Port-injected Adminboard Entitlement Clock runtime. Auth adapters wire
 * Access / Extension Prisma+Stripe ports and Renew Prompt rearm; tests inject
 * mocks.
 */

import {
  assignPermanentFreeToCustomer,
  clockEndForSubscriptionStatus,
  extendEntitlementClock,
  type AdminCustomerAccessStore,
  type AdminCustomerAccessStripeGateway,
  type AssignPermanentFreeInput,
  type AssignPermanentFreeResult,
  type EntitlementExtensionStore,
  type EntitlementExtensionStripeGateway,
  type ExtendEntitlementClockInput,
  type ExtendEntitlementClockResult,
} from '@virtality/shared/utils'

export type AdminEntitlementClockRearmPort = {
  rearmForNewClock: (input: {
    userId: string
    clockEnd: Date
  }) => Promise<unknown>
  rearmAfterExtension: (input: {
    userId: string
    previousClockEnd: Date | null
    nextClockEnd: Date | null
  }) => Promise<unknown>
}

export type AdminEntitlementClockRuntimePorts = {
  accessStore: AdminCustomerAccessStore
  accessStripe: AdminCustomerAccessStripeGateway
  extensionStore: EntitlementExtensionStore
  extensionStripe: EntitlementExtensionStripeGateway
  rearm: AdminEntitlementClockRearmPort
  freePlanPriceId: string
  proPlanPriceId: string
  now?: () => Date
}

export type AdminEntitlementClockRuntime = {
  assignPermanentFree: (
    input: Omit<AssignPermanentFreeInput, 'priceId'>,
  ) => Promise<AssignPermanentFreeResult>
  extendEntitlementClock: (
    input: Omit<ExtendEntitlementClockInput, 'priceId'>,
  ) => Promise<ExtendEntitlementClockResult>
}

async function readPreviousClockEnd(
  extensionStore: EntitlementExtensionStore,
  userId: string,
): Promise<Date | null> {
  const live = await extensionStore.findLiveSubscriptionByUserId(userId)
  if (!live) return null
  return clockEndForSubscriptionStatus(
    live.status,
    live.trialEnd,
    live.periodEnd,
  )
}

export function createAdminEntitlementClockRuntimeFromPorts(
  ports: AdminEntitlementClockRuntimePorts,
): AdminEntitlementClockRuntime {
  const {
    accessStore,
    accessStripe,
    extensionStore,
    extensionStripe,
    rearm,
    freePlanPriceId,
    proPlanPriceId,
    now,
  } = ports

  return {
    assignPermanentFree(input) {
      return assignPermanentFreeToCustomer(
        accessStore,
        accessStripe,
        {
          ...input,
          priceId: freePlanPriceId,
        },
        { now },
      )
    },
    async extendEntitlementClock(input) {
      const previousClockEnd = await readPreviousClockEnd(
        extensionStore,
        input.userId,
      )

      const result = await extendEntitlementClock(
        extensionStore,
        extensionStripe,
        {
          ...input,
          priceId: proPlanPriceId,
        },
        { now },
      )

      await rearm.rearmAfterExtension({
        userId: input.userId,
        previousClockEnd,
        nextClockEnd: result.trialEnd,
      })

      return result
    },
  }
}
