import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import type Stripe from 'stripe'
import { FREE_PLAN_PRICE_ID, PRO_PLAN_PRICE_ID } from '../auth-instance.ts'
import {
  createPrismaAdminCustomerAccessStore,
  createStripeAdminCustomerAccessGateway,
} from './admin-customer-access.ts'
import {
  createPrismaEntitlementExtensionStore,
  createStripeEntitlementExtensionGateway,
} from './entitlement-extension.ts'
import {
  createAdminEntitlementClockRuntimeFromPorts,
  type AdminEntitlementClockRuntime,
} from './admin-entitlement-clock-runtime.ts'
import { createRenewPromptLifecycle } from './renew-prompt-lifecycle.ts'

export type { AdminEntitlementClockRuntime }

/** Request-scoped Adminboard Entitlement Clock runtime (Access + Extension). */
export function createAdminEntitlementClockRuntime(deps: {
  prisma?: PrismaClient
  stripeClient: Stripe
  now?: () => Date
}): AdminEntitlementClockRuntime {
  const client = deps.prisma ?? prisma
  const lifecycle = createRenewPromptLifecycle({ prisma: client })

  return createAdminEntitlementClockRuntimeFromPorts({
    accessStore: createPrismaAdminCustomerAccessStore(client),
    accessStripe: createStripeAdminCustomerAccessGateway(deps.stripeClient),
    extensionStore: createPrismaEntitlementExtensionStore(client),
    extensionStripe: createStripeEntitlementExtensionGateway(deps.stripeClient),
    rearm: lifecycle,
    freePlanPriceId: FREE_PLAN_PRICE_ID,
    proPlanPriceId: PRO_PLAN_PRICE_ID,
    now: deps.now,
  })
}
