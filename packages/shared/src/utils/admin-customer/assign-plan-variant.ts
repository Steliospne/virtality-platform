/**
 * Adminboard Assigned Variant assignment: staff set User.assignedDefaultVariant
 * when the seat is not live paid Default. Audits with before/after snapshots.
 */

import { type AdminCustomerBillingSnapshot } from './admin-customer-access.ts'
import {
  type AdminCustomerBillingSubscriptionRow,
  findLivePaidDefaultSubscription,
} from './admin-customer-billing.ts'
import {
  ASSIGN_PLAN_VARIANT_ACTION,
  ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE,
  DEFAULT_ASSIGNED_PLAN_VARIANT,
  effectiveAssignedPlanVariant,
  resolvePlanVariantPair,
  type PlanVariantCatalog,
} from '../billing/plan-variant-catalog.ts'

export {
  ASSIGN_PLAN_VARIANT_ACTION,
  ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE,
}

export type AssignPlanVariantAuditRecord = {
  targetUserId: string
  actorUserId: string
  action: typeof ASSIGN_PLAN_VARIANT_ACTION
  reason: string
  outcome: 'success' | 'failure'
  stripeOperationId: string | null
  beforeBillingState: AdminCustomerBillingSnapshot
  afterBillingState: AdminCustomerBillingSnapshot | null
}

export type AssignPlanVariantTargetUser = {
  id: string
  assignedDefaultVariant: string | null
}

export type AssignPlanVariantStore = {
  findTargetUser: (
    userId: string,
  ) => Promise<AssignPlanVariantTargetUser | null>
  listSubscriptions: (
    userId: string,
  ) => Promise<AdminCustomerBillingSubscriptionRow[]>
  summarizeBillingState: (
    userId: string,
  ) => Promise<AdminCustomerBillingSnapshot>
  updateAssignedPlanVariant: (
    userId: string,
    variantName: string | null,
  ) => Promise<void>
  recordAudit: (
    record: AssignPlanVariantAuditRecord,
  ) => Promise<{ id: string; record: AssignPlanVariantAuditRecord }>
}

export type AssignPlanVariantInput = {
  userId: string
  actorUserId: string
  reason: string
  /** Snake_case variant name; `basic` stores as null (sparse). */
  variantName: string
}

export type AssignPlanVariantResult = {
  auditId: string
  assignedDefaultVariant: string
}

export class AssignPlanVariantValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssignPlanVariantValidationError'
  }
}

export class AssignPlanVariantNotFoundError extends Error {
  constructor(userId: string) {
    super(`Customer not found for user "${userId}".`)
    this.name = 'AssignPlanVariantNotFoundError'
  }
}

export class AssignPlanVariantStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssignPlanVariantStateError'
  }
}

export function canChangeAssignedPlanVariant(
  subscriptions: readonly AdminCustomerBillingSubscriptionRow[],
): boolean {
  return findLivePaidDefaultSubscription(subscriptions) == null
}

function assertReason(reason: string): void {
  if (reason.trim().length < 3) {
    throw new AssignPlanVariantValidationError(
      'Reason must be at least 3 characters.',
    )
  }
}

/**
 * Sparse write: `basic` clears the column (null). Other names store the
 * normalized kebab-case value (e.g. `early-bird`).
 */
export function sparseAssignedPlanVariantWrite(
  variantName: string,
): string | null {
  const effective = effectiveAssignedPlanVariant(variantName)
  if (effective === DEFAULT_ASSIGNED_PLAN_VARIANT) return null
  return effective
}

export async function assignPlanVariantForCustomer(
  store: AssignPlanVariantStore,
  catalog: PlanVariantCatalog,
  input: AssignPlanVariantInput,
): Promise<AssignPlanVariantResult> {
  if (!input.userId.trim()) {
    throw new AssignPlanVariantValidationError('userId is required.')
  }
  if (!input.actorUserId.trim()) {
    throw new AssignPlanVariantValidationError('actorUserId is required.')
  }
  assertReason(input.reason)

  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new AssignPlanVariantNotFoundError(input.userId)
  }

  const subscriptions = await store.listSubscriptions(user.id)
  if (!canChangeAssignedPlanVariant(subscriptions)) {
    throw new AssignPlanVariantStateError(
      ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE,
    )
  }

  const resolved = resolvePlanVariantPair(catalog, input.variantName)
  if (!resolved.ok) {
    throw new AssignPlanVariantValidationError(
      resolved.reason === 'basic_missing'
        ? 'Assigned Variant catalog is missing a complete basic pair.'
        : `Assigned Variant "${resolved.variantName}" is not a complete monthly+yearly pair.`,
    )
  }

  const beforeBillingState = await store.summarizeBillingState(user.id)
  const sparseValue = sparseAssignedPlanVariantWrite(resolved.pair.name)
  await store.updateAssignedPlanVariant(user.id, sparseValue)

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: ASSIGN_PLAN_VARIANT_ACTION,
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: null,
    beforeBillingState,
    afterBillingState,
  })

  return {
    auditId: audit.id,
    assignedDefaultVariant: effectiveAssignedPlanVariant(sparseValue),
  }
}
