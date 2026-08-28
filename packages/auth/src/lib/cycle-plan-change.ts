/**
 * Better Auth server adapter for Cycle plan change (admin acting for a
 * customer referenceId). Requires stripe.subscription.authorizeReference.
 */

import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import type { CyclePlanChangePort } from '@virtality/shared/utils'
import { auth } from '../auth-instance.ts'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

async function readStripeScheduleId(
  client: PrismaClient,
  referenceId: string,
): Promise<string | null> {
  const row = await client.subscription.findFirst({
    where: {
      referenceId,
      stripeScheduleId: { not: null },
      status: { in: ['active', 'trialing'] },
    },
    select: { stripeScheduleId: true },
  })
  return row?.stripeScheduleId ?? null
}

/**
 * Maps server `auth.api` upgrade/restore into the shared Cycle plan change port.
 * `headers` must carry the admin session cookie.
 */
export function createBetterAuthCyclePlanChangePort(
  headers: Headers,
  client: PrismaClient = prisma,
): CyclePlanChangePort {
  return {
    upgrade: async (input) => {
      try {
        await auth.api.upgradeSubscription({
          headers,
          body: {
            plan: input.plan,
            annual: input.annual,
            referenceId: input.referenceId,
            scheduleAtPeriodEnd: true,
            disableRedirect: true,
            successUrl: input.successUrl,
            cancelUrl: input.cancelUrl,
            returnUrl: input.returnUrl,
          },
        })
        const stripeScheduleId = input.referenceId
          ? await readStripeScheduleId(client, input.referenceId)
          : null
        return { data: {}, stripeScheduleId }
      } catch (error) {
        return {
          error: {
            message: errorMessage(
              error,
              'Failed to schedule Cycle plan change',
            ),
          },
        }
      }
    },
    restore: async (input) => {
      try {
        const restored = await auth.api.restoreSubscription({
          headers,
          body: {
            ...(input.referenceId ? { referenceId: input.referenceId } : {}),
          },
        })
        const stripeSubscriptionId =
          restored &&
          typeof restored === 'object' &&
          'id' in restored &&
          typeof restored.id === 'string'
            ? restored.id
            : null
        return { data: restored, stripeSubscriptionId }
      } catch (error) {
        return {
          error: {
            message: errorMessage(error, 'Failed to restore the subscription'),
          },
        }
      }
    },
  }
}
