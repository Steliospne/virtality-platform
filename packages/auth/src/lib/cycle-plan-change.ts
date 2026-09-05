/**
 * Better Auth server adapter for Cycle plan restore (admin acting for a
 * customer referenceId). Requires stripe.subscription.authorizeReference.
 */

import type { CyclePlanChangeRestorePort } from '@virtality/shared/utils'
import { auth } from '../auth-instance.ts'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

function asPortError(
  error: unknown,
  fallback: string,
): { error: { message: string } } {
  return { error: { message: errorMessage(error, fallback) } }
}

function stripeSubscriptionIdFromRestore(restored: unknown): string | null {
  if (
    restored &&
    typeof restored === 'object' &&
    'id' in restored &&
    typeof restored.id === 'string'
  ) {
    return restored.id
  }
  return null
}

/**
 * Maps server `auth.api.restoreSubscription` into the shared Cycle plan
 * restore port. `headers` must carry the admin session cookie.
 */
export function createBetterAuthCyclePlanRestorePort(
  headers: Headers,
): CyclePlanChangeRestorePort {
  return {
    restore: async (input) => {
      try {
        const restored = await auth.api.restoreSubscription({
          headers,
          body: {
            ...(input.referenceId ? { referenceId: input.referenceId } : {}),
          },
        })
        return {
          data: restored,
          stripeSubscriptionId: stripeSubscriptionIdFromRestore(restored),
        }
      } catch (error) {
        return asPortError(error, 'Failed to restore the subscription')
      }
    },
  }
}
