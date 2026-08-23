import { ORPCError } from '@orpc/server'
import {
  assignPermanentFreeAction,
  grantTimedTrialAction,
} from '@virtality/auth'
import { z } from 'zod'
import {
  assignPermanentFreeInputSchema,
  grantTimedTrialInputSchema,
} from '@virtality/shared/types'
import {
  AdminCustomerAccessAlreadyEntitledError,
  AdminCustomerAccessNotFoundError,
  AdminCustomerAccessValidationError,
} from '@virtality/shared/utils'
import { adminAuthed } from '../middleware/admin.ts'
import {
  getAdminCustomerProfile,
  listAdminCustomers,
  resolveAdminCustomerStripeMode,
} from './admin-customer-service.ts'

const profileInputSchema = z.object({
  userId: z.string().trim().min(1),
})

function throwAdminCustomerAccessOrpcError(error: unknown): never {
  if (
    error instanceof AdminCustomerAccessValidationError ||
    error instanceof AdminCustomerAccessNotFoundError ||
    error instanceof AdminCustomerAccessAlreadyEntitledError
  ) {
    throw new ORPCError('BAD_REQUEST', { message: error.message })
  }
  if (error instanceof Error) {
    throw new ORPCError('BAD_REQUEST', {
      message: `Customer access mutation failed: ${error.message}`,
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
      throwAdminCustomerAccessOrpcError(error)
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
      throwAdminCustomerAccessOrpcError(error)
    }
  })

export const adminCustomer = {
  list,
  getProfile,
  assignPermanentFree,
  grantTimedTrial,
}
