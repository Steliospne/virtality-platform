/**
 * Adminboard Assigned Variant assignment: staff set User.assignedProVariant
 * when the seat is not live paid Pro. Audits with before/after snapshots.
 */

import { type AdminCustomerBillingSnapshot } from './admin-customer-access.ts'
import {
  type AdminCustomerBillingSubscriptionRow,
  findLivePaidProSubscription,
} from './admin-customer-billing.ts'
import {
  ASSIGN_PRO_VARIANT_ACTION,
  ASSIGN_PRO_VARIANT_LIVE_PAID_BLOCK_MESSAGE,
  DEFAULT_ASSIGNED_PRO_VARIANT,
  effectiveAssignedProVariant,
  resolveProVariantPair,
  type ProVariantCatalog,
} from './billing/pro-variant-catalog.ts'

export { ASSIGN_PRO_VARIANT_ACTION, ASSIGN_PRO_VARIANT_LIVE_PAID_BLOCK_MESSAGE }

export type AssignProVariantAuditRecord = {
  targetUserId: string
  actorUserId: string
  action: typeof ASSIGN_PRO_VARIANT_ACTION
  reason: string
  outcome: 'success' | 'failure'
  stripeOperationId: string | null
  beforeBillingState: AdminCustomerBillingSnapshot
  afterBillingState: AdminCustomerBillingSnapshot | null
}

export type AssignProVariantTargetUser = {
  id: string
  assignedProVariant: string | null
}

export type AssignProVariantStore = {
  findTargetUser: (userId: string) => Promise<AssignProVariantTargetUser | null>
  listSubscriptions: (
    userId: string,
  ) => Promise<AdminCustomerBillingSubscriptionRow[]>
  summarizeBillingState: (
    userId: string,
  ) => Promise<AdminCustomerBillingSnapshot>
  updateAssignedProVariant: (
    userId: string,
    variantName: string | null,
  ) => Promise<void>
  recordAudit: (
    record: AssignProVariantAuditRecord,
  ) => Promise<{ id: string; record: AssignProVariantAuditRecord }>
}

export type AssignProVariantInput = {
  userId: string
  actorUserId: string
  reason: string
  /** Snake_case variant name; `basic` stores as null (sparse). */
  variantName: string
}

export type AssignProVariantResult = {
  auditId: string
  assignedProVariant: string
}

export class AssignProVariantValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssignProVariantValidationError'
  }
}

export class AssignProVariantNotFoundError extends Error {
  constructor(userId: string) {
    super(`Customer not found for user "${userId}".`)
    this.name = 'AssignProVariantNotFoundError'
  }
}

export class AssignProVariantStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssignProVariantStateError'
  }
}

export function canChangeAssignedProVariant(
  subscriptions: readonly AdminCustomerBillingSubscriptionRow[],
): boolean {
  return findLivePaidProSubscription(subscriptions) == null
}

function assertReason(reason: string): void {
  if (reason.trim().length < 3) {
    throw new AssignProVariantValidationError(
      'Reason must be at least 3 characters.',
    )
  }
}

/**
 * Sparse write: `basic` clears the column (null). Other names store the
 * normalized kebab-case value (e.g. `early-bird`).
 */
export function sparseAssignedProVariantWrite(
  variantName: string,
): string | null {
  const effective = effectiveAssignedProVariant(variantName)
  if (effective === DEFAULT_ASSIGNED_PRO_VARIANT) return null
  return effective
}

export async function assignProVariantForCustomer(
  store: AssignProVariantStore,
  catalog: ProVariantCatalog,
  input: AssignProVariantInput,
): Promise<AssignProVariantResult> {
  if (!input.userId.trim()) {
    throw new AssignProVariantValidationError('userId is required.')
  }
  if (!input.actorUserId.trim()) {
    throw new AssignProVariantValidationError('actorUserId is required.')
  }
  assertReason(input.reason)

  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new AssignProVariantNotFoundError(input.userId)
  }

  const subscriptions = await store.listSubscriptions(user.id)
  if (!canChangeAssignedProVariant(subscriptions)) {
    throw new AssignProVariantStateError(
      ASSIGN_PRO_VARIANT_LIVE_PAID_BLOCK_MESSAGE,
    )
  }

  const resolved = resolveProVariantPair(catalog, input.variantName)
  if (!resolved.ok) {
    throw new AssignProVariantValidationError(
      resolved.reason === 'basic_missing'
        ? 'Assigned Variant catalog is missing a complete basic pair.'
        : `Assigned Variant "${resolved.variantName}" is not a complete monthly+yearly pair.`,
    )
  }

  const beforeBillingState = await store.summarizeBillingState(user.id)
  const sparseValue = sparseAssignedProVariantWrite(resolved.pair.name)
  await store.updateAssignedProVariant(user.id, sparseValue)

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: ASSIGN_PRO_VARIANT_ACTION,
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: null,
    beforeBillingState,
    afterBillingState,
  })

  return {
    auditId: audit.id,
    assignedProVariant: effectiveAssignedProVariant(sparseValue),
  }
}
