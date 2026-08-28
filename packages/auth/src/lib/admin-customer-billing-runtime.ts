/**
 * Port-injected Adminboard paid-billing runtime. Auth adapters wire Prisma,
 * Stripe, and the Better Auth Cycle plan port; tests inject mocks.
 */

import {
  assignFreeAfterCancellationForCustomer,
  cancelCyclePlanChangeForCustomer,
  cancelPaidSubscriptionForCustomer,
  changePaidPlanForCustomer,
  previewChangePaidPlan,
  reactivatePaidSubscriptionForCustomer,
  sendPaidCheckoutLinkForCustomer,
  type AdminCustomerBillingStore,
  type AdminCustomerBillingStripeGateway,
  type AdminCustomerCyclePlanPort,
  type AssignFreeAfterCancellationInput,
  type CancelCyclePlanChangeInput,
  type CancelPaidSubscriptionInput,
  type ChangePaidPlanInput,
  type ReactivatePaidSubscriptionInput,
  type SendPaidCheckoutLinkInput,
} from '@virtality/shared/utils'

export type AdminCustomerBillingCheckoutReturnUrls = {
  successUrl: string
  cancelUrl: string
}

export type AdminCustomerBillingRuntimePorts = {
  store: AdminCustomerBillingStore
  stripe: AdminCustomerBillingStripeGateway
  cyclePlan: AdminCustomerCyclePlanPort
  freePlanPriceId: string
  checkoutReturnUrls: (userId: string) => AdminCustomerBillingCheckoutReturnUrls
}

type OptionalCheckoutReturnUrls = {
  successUrl?: string
  cancelUrl?: string
}

type ChangePaidPlanRuntimeInput = Omit<
  ChangePaidPlanInput,
  'successUrl' | 'cancelUrl'
> &
  OptionalCheckoutReturnUrls

type SendPaidCheckoutLinkRuntimeInput = Omit<
  SendPaidCheckoutLinkInput,
  'successUrl' | 'cancelUrl'
> &
  OptionalCheckoutReturnUrls

export type AdminCustomerBillingRuntime = {
  previewChangePaidPlan: (input: {
    userId: string
    targetPriceId: string
  }) => ReturnType<typeof previewChangePaidPlan>
  changePaidPlan: (
    input: ChangePaidPlanRuntimeInput,
  ) => ReturnType<typeof changePaidPlanForCustomer>
  cancelPaidSubscription: (
    input: CancelPaidSubscriptionInput,
  ) => ReturnType<typeof cancelPaidSubscriptionForCustomer>
  reactivatePaidSubscription: (
    input: ReactivatePaidSubscriptionInput,
  ) => ReturnType<typeof reactivatePaidSubscriptionForCustomer>
  cancelCyclePlanChange: (
    input: CancelCyclePlanChangeInput,
  ) => ReturnType<typeof cancelCyclePlanChangeForCustomer>
  assignFreeAfterCancellation: (
    input: Omit<AssignFreeAfterCancellationInput, 'priceId'>,
  ) => ReturnType<typeof assignFreeAfterCancellationForCustomer>
  sendPaidCheckoutLink: (
    input: SendPaidCheckoutLinkRuntimeInput,
  ) => ReturnType<typeof sendPaidCheckoutLinkForCustomer>
}

function resolveCheckoutReturnUrls(
  checkoutReturnUrls: AdminCustomerBillingRuntimePorts['checkoutReturnUrls'],
  input: { userId: string } & OptionalCheckoutReturnUrls,
): AdminCustomerBillingCheckoutReturnUrls {
  const defaults = checkoutReturnUrls(input.userId)
  return {
    successUrl: input.successUrl ?? defaults.successUrl,
    cancelUrl: input.cancelUrl ?? defaults.cancelUrl,
  }
}

export function createAdminCustomerBillingRuntimeFromPorts(
  ports: AdminCustomerBillingRuntimePorts,
): AdminCustomerBillingRuntime {
  const { store, stripe, cyclePlan, freePlanPriceId, checkoutReturnUrls } =
    ports

  return {
    previewChangePaidPlan(input) {
      return previewChangePaidPlan(store, stripe, input)
    },
    changePaidPlan(input) {
      return changePaidPlanForCustomer(store, stripe, cyclePlan, {
        ...input,
        ...resolveCheckoutReturnUrls(checkoutReturnUrls, input),
      })
    },
    cancelPaidSubscription(input) {
      return cancelPaidSubscriptionForCustomer(store, stripe, input)
    },
    reactivatePaidSubscription(input) {
      return reactivatePaidSubscriptionForCustomer(store, cyclePlan, input)
    },
    cancelCyclePlanChange(input) {
      return cancelCyclePlanChangeForCustomer(store, cyclePlan, input)
    },
    assignFreeAfterCancellation(input) {
      return assignFreeAfterCancellationForCustomer(store, stripe, {
        ...input,
        priceId: freePlanPriceId,
      })
    },
    sendPaidCheckoutLink(input) {
      return sendPaidCheckoutLinkForCustomer(store, stripe, {
        ...input,
        ...resolveCheckoutReturnUrls(checkoutReturnUrls, input),
      })
    },
  }
}
