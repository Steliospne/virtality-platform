import { ORPCError } from '@orpc/server'
import {
  assignProVariantAction,
  createAdminCustomerBillingRuntime,
  createTrialGrantRuntime,
  getRequiredStripeClient,
  listAssignableProVariantsAction,
  stripeClient,
} from '@virtality/auth'
import { z } from 'zod'
import {
  assignFreeAfterCancellationInputSchema,
  assignPermanentFreeInputSchema,
  assignProVariantInputSchema,
  adjustTrialGrantInputSchema,
  cancelCyclePlanChangeInputSchema,
  cancelPaidSubscriptionInputSchema,
  changePaidPlanInputSchema,
  grantTimedTrialInputSchema,
  issueTrialGrantInputSchema,
  listAssignableProVariantsInputSchema,
  previewChangePaidPlanInputSchema,
  reactivatePaidSubscriptionInputSchema,
  revokeTrialGrantInputSchema,
  sendPaidCheckoutLinkInputSchema,
  startTrialGrantInputSchema,
} from '@virtality/shared/types'
import {
  AdminCustomerAccessAlreadyEntitledError,
  AdminCustomerAccessNotFoundError,
  AdminCustomerAccessValidationError,
  AdminCustomerBillingNotFoundError,
  AdminCustomerBillingStateError,
  AdminCustomerBillingValidationError,
  AssignProVariantNotFoundError,
  AssignProVariantStateError,
  AssignProVariantValidationError,
  TrialGrantAlreadyOpenError,
  TrialGrantCustomerAlreadyEntitledError,
  TrialGrantCustomerNotFoundError,
  TrialGrantNotActiveError,
  TrialGrantNotFoundError,
  TrialGrantOpenNotFoundError,
  TrialGrantValidationError,
} from '@virtality/shared/utils'
import { adminAuthed } from '../middleware/admin.ts'
import type { InitialContext } from '../context.ts'
import { adminEntitlementClockRuntime } from './admin-entitlement-clock-runtime.ts'
import {
  getAdminCustomerProfile,
  listAdminCustomers,
  resolveAdminCustomerStripeMode,
} from './admin-customer-service.ts'

const profileInputSchema = z.object({
  userId: z.string().trim().min(1),
})

function adminCustomerBillingRuntime(context: InitialContext) {
  return createAdminCustomerBillingRuntime({
    prisma: context.prisma,
    stripeClient: getRequiredStripeClient(),
    headers: context.headers,
  })
}

function trialGrantRuntime(context: InitialContext) {
  return createTrialGrantRuntime({
    prisma: context.prisma,
  })
}

function throwAdminCustomerOrpcError(error: unknown): never {
  if (
    error instanceof AdminCustomerAccessValidationError ||
    error instanceof AdminCustomerAccessNotFoundError ||
    error instanceof AdminCustomerAccessAlreadyEntitledError ||
    error instanceof AdminCustomerBillingValidationError ||
    error instanceof AdminCustomerBillingNotFoundError ||
    error instanceof AdminCustomerBillingStateError ||
    error instanceof AssignProVariantValidationError ||
    error instanceof AssignProVariantNotFoundError ||
    error instanceof AssignProVariantStateError ||
    error instanceof TrialGrantValidationError ||
    error instanceof TrialGrantCustomerNotFoundError ||
    error instanceof TrialGrantAlreadyOpenError ||
    error instanceof TrialGrantCustomerAlreadyEntitledError ||
    error instanceof TrialGrantNotFoundError ||
    error instanceof TrialGrantNotActiveError ||
    error instanceof TrialGrantOpenNotFoundError
  ) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  if (error instanceof Error) {
    throw new ORPCError('BAD_REQUEST', {
      message: `Customer action failed: ${error.message}`,
    })
  }
  throw error
}

const list = adminAuthed
  .route({ path: '/admin-customer/list', method: 'GET' })
  .handler(async ({ context }) => listAdminCustomers(context.prisma))

const getProfile = adminAuthed
  .route({ path: '/admin-customer/profile', method: 'GET' })
  .input(profileInputSchema)
  .handler(async ({ context, input }) => {
    const profile = await getAdminCustomerProfile(context.prisma, {
      userId: input.userId,
      stripeMode: resolveAdminCustomerStripeMode(),
    })

    if (!profile) {
      throw new ORPCError('NOT_FOUND', { message: 'Customer not found' })
    }

    return profile
  })

const listAssignableProVariants = adminAuthed
  .route({
    path: '/admin-customer/list-assignable-pro-variants',
    method: 'GET',
  })
  .input(listAssignableProVariantsInputSchema)
  .handler(async () => listAssignableProVariantsAction(stripeClient))

const assignProVariant = adminAuthed
  .route({ path: '/admin-customer/assign-pro-variant', method: 'POST' })
  .input(assignProVariantInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await assignProVariantAction({
        stripeClient,
        prisma: context.prisma,
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
        variantName: input.variantName,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const assignPermanentFree = adminAuthed
  .route({ path: '/admin-customer/assign-permanent-free', method: 'POST' })
  .input(assignPermanentFreeInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const clock = adminEntitlementClockRuntime(context)
      return await clock.assignPermanentFree({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const grantTimedTrial = adminAuthed
  .route({ path: '/admin-customer/grant-timed-trial', method: 'POST' })
  .input(grantTimedTrialInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const clock = adminEntitlementClockRuntime(context)
      return await clock.grantTimedTrial({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
        amount: input.amount,
        unit: input.unit,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const issueTrialGrant = adminAuthed
  .route({ path: '/admin-customer/issue-trial-grant', method: 'POST' })
  .input(issueTrialGrantInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const runtime = trialGrantRuntime(context)
      return await runtime.issueGrant({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
        code: input.code,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const startTrialGrant = adminAuthed
  .route({ path: '/admin-customer/start-trial-grant', method: 'POST' })
  .input(startTrialGrantInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const runtime = trialGrantRuntime(context)
      return await runtime.startTrial({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
        amount: input.amount,
        unit: input.unit,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const adjustTrialGrant = adminAuthed
  .route({ path: '/admin-customer/adjust-trial-grant', method: 'POST' })
  .input(adjustTrialGrantInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const runtime = trialGrantRuntime(context)
      return await runtime.adjustTrial({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
        amount: input.amount,
        unit: input.unit,
        direction: input.direction,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const revokeTrialGrant = adminAuthed
  .route({ path: '/admin-customer/revoke-trial-grant', method: 'POST' })
  .input(revokeTrialGrantInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const runtime = trialGrantRuntime(context)
      return await runtime.revokeTrial({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const previewChangePaidPlan = adminAuthed
  .route({ path: '/admin-customer/preview-change-paid-plan', method: 'GET' })
  .input(previewChangePaidPlanInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const billing = adminCustomerBillingRuntime(context)
      return await billing.previewChangePaidPlan({
        userId: input.userId,
        targetPriceId: input.targetPriceId,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const changePaidPlan = adminAuthed
  .route({ path: '/admin-customer/change-paid-plan', method: 'POST' })
  .input(changePaidPlanInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const billing = adminCustomerBillingRuntime(context)
      return await billing.changePaidPlan({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
        targetPriceId: input.targetPriceId,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const cancelPaidSubscription = adminAuthed
  .route({ path: '/admin-customer/cancel-paid-subscription', method: 'POST' })
  .input(cancelPaidSubscriptionInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const billing = adminCustomerBillingRuntime(context)
      return await billing.cancelPaidSubscription({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
        mode: input.mode,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const reactivatePaidSubscription = adminAuthed
  .route({
    path: '/admin-customer/reactivate-paid-subscription',
    method: 'POST',
  })
  .input(reactivatePaidSubscriptionInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const billing = adminCustomerBillingRuntime(context)
      return await billing.reactivatePaidSubscription({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const cancelCyclePlanChange = adminAuthed
  .route({
    path: '/admin-customer/cancel-cycle-plan-change',
    method: 'POST',
  })
  .input(cancelCyclePlanChangeInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const billing = adminCustomerBillingRuntime(context)
      return await billing.cancelCyclePlanChange({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const assignFreeAfterCancellation = adminAuthed
  .route({
    path: '/admin-customer/assign-free-after-cancellation',
    method: 'POST',
  })
  .input(assignFreeAfterCancellationInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const billing = adminCustomerBillingRuntime(context)
      return await billing.assignFreeAfterCancellation({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

const sendPaidCheckoutLink = adminAuthed
  .route({ path: '/admin-customer/send-paid-checkout-link', method: 'POST' })
  .input(sendPaidCheckoutLinkInputSchema)
  .handler(async ({ context, input }) => {
    try {
      const billing = adminCustomerBillingRuntime(context)
      return await billing.sendPaidCheckoutLink({
        userId: input.userId,
        actorUserId: context.user.id,
        reason: input.reason,
        targetPriceId: input.targetPriceId,
      })
    } catch (error) {
      throwAdminCustomerOrpcError(error)
    }
  })

export const adminCustomer = {
  list,
  getProfile,
  listAssignableProVariants,
  assignProVariant,
  assignPermanentFree,
  grantTimedTrial,
  issueTrialGrant,
  startTrialGrant,
  adjustTrialGrant,
  revokeTrialGrant,
  previewChangePaidPlan,
  changePaidPlan,
  cancelPaidSubscription,
  reactivatePaidSubscription,
  cancelCyclePlanChange,
  assignFreeAfterCancellation,
  sendPaidCheckoutLink,
}
