/**
 * Adminboard Assigned Variant assign runtime (Prisma store + catalog).
 */

import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  assignPlanVariantForCustomer,
  DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
  type AssignPlanVariantStore,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { createPrismaAdminCustomerBillingStore } from './admin-customer-billing.ts'
import {
  readPlanVariantCatalogFresh,
  toAssignablePlanVariantOptions,
} from './plan-variant-catalog.ts'

export function createPrismaAssignPlanVariantStore(
  client: PrismaClient = prisma,
): AssignPlanVariantStore {
  const billingStore = createPrismaAdminCustomerBillingStore(client)
  return {
    findTargetUser: async (userId) => {
      const user = await client.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true, assignedDefaultVariant: true },
      })
      return user ?? null
    },
    listSubscriptions: async (userId) => billingStore.listSubscriptions(userId),
    summarizeBillingState: async (userId) =>
      billingStore.summarizeBillingState(userId),
    updateAssignedPlanVariant: async (userId, variantName) => {
      await client.user.update({
        where: { id: userId },
        data: { assignedDefaultVariant: variantName },
      })
    },
    recordAudit: async (record) => {
      const row = await client.adminCustomerAudit.create({
        data: {
          targetUserId: record.targetUserId,
          actorUserId: record.actorUserId,
          action: record.action,
          reason: record.reason,
          outcome: record.outcome,
          stripeOperationId: record.stripeOperationId,
          beforeBillingState: record.beforeBillingState,
          afterBillingState: record.afterBillingState ?? undefined,
          createdAt: new Date(),
        },
      })
      return { id: row.id, record }
    },
  }
}

export async function listAssignablePlanVariantsAction(
  stripeClient: Stripe | null,
) {
  const catalog = await readPlanVariantCatalogFresh(stripeClient)
  return {
    variants: toAssignablePlanVariantOptions(catalog),
    basicPresent: catalog.basic != null,
    productName: catalog.productName ?? DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
  }
}

export async function assignPlanVariantAction(input: {
  stripeClient: Stripe | null
  prisma?: PrismaClient
  userId: string
  actorUserId: string
  reason: string
  variantName: string
}) {
  const catalog = await readPlanVariantCatalogFresh(input.stripeClient)
  const store = createPrismaAssignPlanVariantStore(input.prisma ?? prisma)
  return assignPlanVariantForCustomer(store, catalog, {
    userId: input.userId,
    actorUserId: input.actorUserId,
    reason: input.reason,
    variantName: input.variantName,
  })
}
