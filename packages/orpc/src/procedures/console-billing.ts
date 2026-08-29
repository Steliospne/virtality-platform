import {
  readBillingCatalogForUserAction,
  scheduleAssignedVariantCyclePlanChange,
  startAssignedVariantSubscribeCheckout,
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

const startSubscribeCheckout = authed
  .route({
    path: '/console-billing/start-subscribe-checkout',
    method: 'POST',
  })
  .input(
    z.object({
      annual: z.boolean(),
      returnUrl: z.string().min(1),
    }),
  )
  .handler(async ({ context, input }) => {
    if (!stripeClient) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Stripe is not configured.',
      })
    }
    const result = await startAssignedVariantSubscribeCheckout({
      stripeClient,
      prisma: context.prisma,
      referenceId: context.user.id,
      annual: input.annual,
      returnUrl: input.returnUrl,
    })
    if (!result.ok) {
      throw new ORPCError('BAD_REQUEST', { message: result.message })
    }
    return result
  })

export const consoleBilling = {
  readCatalog,
  scheduleCyclePlanChange,
  startSubscribeCheckout,
}
