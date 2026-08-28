import { ORPCError } from '@orpc/server'
import {
  assignPermanentFreeAction,
  createAdminCustomerBillingRuntime,
  getRequiredStripeClient,
  grantTimedTrialAction,
} from '@virtality/auth'
import { z } from 'zod'
import {
  assignFreeAfterCancellationInputSchema,
  assignPermanentFreeInputSchema,
  cancelCyclePlanChangeInputSchema,
  cancelPaidSubscriptionInputSchema,
  changePaidPlanInputSchema,
  grantTimedTrialInputSchema,
  previewChangePaidPlanInputSchema,
  reactivatePaidSubscriptionInputSchema,
  sendPaidCheckoutLinkInputSchema,
} from '@virtality/shared/types'
import {
  AdminCustomerAccessAlreadyEntitledError,
  AdminCustomerAccessNotFoundError,
  AdminCustomerAccessValidationError,
  AdminCustomerBillingNotFoundError,
  AdminCustomerBillingStateError,
  AdminCustomerBillingValidationError,
} from '@virtality/shared/utils'
import { adminAuthed } from '../middleware/admin.ts'
import type { InitialContext } from '../context.ts'
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

function throwAdminCustomerOrpcError(error: unknown): never {
  if (
    error instanceof AdminCustomerAccessValidationError ||
    error instanceof AdminCustomerAccessNotFoundError ||
    error instanceof AdminCustomerAccessAlreadyEntitledError ||
    error instanceof AdminCustomerBillingValidationError ||
    error instanceof AdminCustomerBillingNotFoundError ||
    error instanceof AdminCustomerBillingStateError
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

const assignPermanentFree = adminAuthed
  .route({ path: '/admin-customer/assign-permanent-free', method: 'POST' })
  .input(assignPermanentFreeInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await assignPermanentFreeAction(context.prisma, {
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
      return await grantTimedTrialAction(context.prisma, {
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
  assignPermanentFree,
  grantTimedTrial,
  previewChangePaidPlan,
  changePaidPlan,
  cancelPaidSubscription,
  reactivatePaidSubscription,
  cancelCyclePlanChange,
  assignFreeAfterCancellation,
  sendPaidCheckoutLink,
}
