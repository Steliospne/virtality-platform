import {
  createAdminEntitlementClockRuntime,
  getRequiredStripeClient,
} from '@virtality/auth'
import type { InitialContext } from '../context.ts'

/** Wire request-scoped Admin Entitlement Clock runtime from orpc context. */
export function adminEntitlementClockRuntime(context: InitialContext) {
  return createAdminEntitlementClockRuntime({
    prisma: context.prisma,
    stripeClient: getRequiredStripeClient(),
  })
}
