import {
  readBillingCatalogForUserAction,
  scheduleAssignedVariantCyclePlanChange,
  stripeClient,
} from '@virtality/auth'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { authed } from '../middleware/auth.ts'

const readCatalog = authed
  .route({ path: '/console-billing/read-catalog', method: 'GET' })
  .handler(async ({ context }) =>
    readBillingCatalogForUserAction(context.user.id),
  )

const scheduleCyclePlanChange = authed
  .route({
    path: '/console-billing/schedule-cycle-plan-change',
    method: 'POST',
  })
  .input(
    z.object({
      annual: z.boolean(),
    }),
  )
  .handler(async ({ context, input }) => {
    if (!stripeClient) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Stripe is not configured.',
      })
    }
    const result = await scheduleAssignedVariantCyclePlanChange({
      stripeClient,
      prisma: context.prisma,
      referenceId: context.user.id,
      annual: input.annual,
    })
    if (!result.ok) {
      throw new ORPCError('BAD_REQUEST', { message: result.message })
    }
    return result
  })

export const consoleBilling = {
  readCatalog,
  scheduleCyclePlanChange,
}
