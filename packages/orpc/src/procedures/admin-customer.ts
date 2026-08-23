import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { adminAuthed } from '../middleware/admin.ts'
import {
  getAdminCustomerProfile,
  listAdminCustomers,
  resolveAdminCustomerStripeMode,
} from './admin-customer-service.ts'

const profileInputSchema = z.object({
  userId: z.string().trim().min(1),
})

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

export const adminCustomer = {
  list,
  getProfile,
}
