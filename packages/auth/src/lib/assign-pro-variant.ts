/**
 * Adminboard Assigned Variant assign runtime (Prisma store + catalog).
 */

import { prisma } from '@virtality/db'
import type { PrismaClient } from '@virtality/db'
import {
  assignProVariantForCustomer,
  type AssignProVariantStore,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import { createPrismaAdminCustomerBillingStore } from './admin-customer-billing.ts'
import {
  readProVariantCatalogFresh,
  toAssignableProVariantOptions,
} from './pro-variant-catalog.ts'

export function createPrismaAssignProVariantStore(
  client: PrismaClient = prisma,
): AssignProVariantStore {
  const billingStore = createPrismaAdminCustomerBillingStore(client)
  return {
    findTargetUser: async (userId) => {
      const user = await client.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true, assignedProVariant: true },
      })
      return user ?? null
    },
    listSubscriptions: async (userId) => billingStore.listSubscriptions(userId),
    summarizeBillingState: async (userId) =>
      billingStore.summarizeBillingState(userId),
    updateAssignedProVariant: async (userId, variantName) => {
      await client.user.update({
        where: { id: userId },
        data: { assignedProVariant: variantName },
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

export async function listAssignableProVariantsAction(
  stripeClient: Stripe | null,
) {
  const catalog = await readProVariantCatalogFresh(stripeClient)
  return {
    variants: toAssignableProVariantOptions(catalog),
    basicPresent: catalog.basic != null,
  }
}

export async function assignProVariantAction(input: {
  stripeClient: Stripe | null
  prisma?: PrismaClient
  userId: string
  actorUserId: string
  reason: string
  variantName: string
}) {
  const catalog = await readProVariantCatalogFresh(input.stripeClient)
  const store = createPrismaAssignProVariantStore(input.prisma ?? prisma)
  return assignProVariantForCustomer(store, catalog, {
    userId: input.userId,
    actorUserId: input.actorUserId,
    reason: input.reason,
    variantName: input.variantName,
  })
}
