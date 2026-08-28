/**
 * Port-injected Adminboard Entitlement Clock runtime. Auth adapters wire
 * Access / Extension Prisma+Stripe ports and Renew Prompt rearm; tests inject
 * mocks.
 */

import {
  assignPermanentFreeToCustomer,
  clockEndForSubscriptionStatus,
  extendEntitlementClock,
  grantTimedTrialToCustomer,
  type AdminCustomerAccessStore,
  type AdminCustomerAccessStripeGateway,
  type AssignPermanentFreeInput,
  type AssignPermanentFreeResult,
  type EntitlementExtensionStore,
  type EntitlementExtensionStripeGateway,
  type ExtendEntitlementClockInput,
  type ExtendEntitlementClockResult,
  type GrantTimedTrialInput,
  type GrantTimedTrialResult,
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
  grantTimedTrial: (
    input: Omit<GrantTimedTrialInput, 'priceId'>,
  ) => Promise<GrantTimedTrialResult>
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
    async grantTimedTrial(input) {
      const result = await grantTimedTrialToCustomer(
        accessStore,
        accessStripe,
        {
          ...input,
          priceId: freePlanPriceId,
        },
        { now },
      )

      await rearm.rearmForNewClock({
        userId: input.userId,
        clockEnd: result.trialEnd,
      })

      return result
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
