import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  applyAccessCodeVariant,
  resolvePlanVariantPair,
  sparseAssignedPlanVariantWrite,
  type AccessCodeVariantOutcome,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { createPrismaAssignPlanVariantStore } from './assign-plan-variant.ts'
import { readPlanVariantCatalogFresh } from './plan-variant-catalog-adapter.ts'

export class AccessCodeVariantNameInvalidError extends Error {
  constructor(variantName: string) {
    super(`"${variantName}" is not a complete monthly+yearly Plan Variant.`)
    this.name = 'AccessCodeVariantNameInvalidError'
  }
}

/**
 * Validates a Plan Variant name against the live catalog at code-creation
 * time and returns the sparse-written value to store on the code (`null`
 * for `basic`).
 */
export async function resolveAccessCodeVariantName(
  stripeClient: Stripe | null,
  variantName: string,
): Promise<string | null> {
  const catalog = await readPlanVariantCatalogFresh(stripeClient)
  const resolved = resolvePlanVariantPair(catalog, variantName)
  if (!resolved.ok) {
    throw new AccessCodeVariantNameInvalidError(variantName)
  }
  return sparseAssignedPlanVariantWrite(resolved.pair.name)
}

/**
 * Redemption-side variant applier: fresh Stripe-backed catalog + the same
 * Prisma store manual assignment uses, minus the audit/reason requirement.
 */
export function createAccessCodeVariantGateway(
  client: PrismaClient = prisma,
  stripeClient: Stripe | null = null,
): {
  applyVariant: (
    userId: string,
    variantName: string,
  ) => Promise<AccessCodeVariantOutcome>
} {
  const store = createPrismaAssignPlanVariantStore(client)
  return {
    applyVariant: async (userId, variantName) => {
      const catalog = await readPlanVariantCatalogFresh(stripeClient)
      return applyAccessCodeVariant(store, catalog, { userId, variantName })
    },
  }
}
