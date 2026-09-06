import type { AdminCustomerBillingSnapshot } from '../admin-customer/admin-customer-access.ts'
import {
  accessGateStatusForIssue,
  type AccessGateOpenStatus,
  type AccessGateRecord,
  type AccessGateStatus,
} from './access-gate.ts'
import {
  computeExtensionTrialEnd,
  isEntitlementExtensionDirection,
  isEntitlementExtensionDurationUnit,
  type EntitlementExtensionDirection,
  type EntitlementExtensionDurationUnit,
} from './entitlement-extension.ts'

export const STAFF_ACCESS_GATE_AUDIT_ACTIONS = [
  'assign_permanent_access_gate',
  'set_access_gate_trial',
  'revoke_access_gate',
] as const

export type StaffAccessGateAuditAction =
  (typeof STAFF_ACCESS_GATE_AUDIT_ACTIONS)[number]

export type StaffAccessGateTargetUser = {
  id: string
  name: string
  email: string
  role: string | null
}

export type StaffAccessGateStore = {
  findTargetUser: (userId: string) => Promise<StaffAccessGateTargetUser | null>
  findOpenAccessGateByUserId: (
    userId: string,
  ) => Promise<AccessGateRecord | null>
  userHasConvertedAccessGate: (userId: string) => Promise<boolean>
  createAccessGate: (input: {
    userId: string
    trialStart: Date
    trialEnd: Date | null
    status: AccessGateOpenStatus
  }) => Promise<AccessGateRecord>
  updateAccessGate: (input: {
    accessGateId: string
    status: AccessGateOpenStatus
    trialStart?: Date
    trialEnd: Date | null
  }) => Promise<AccessGateRecord>
  revokeAccessGate: (input: { userId: string }) => Promise<AccessGateRecord>
  updateRoleToUser: (userId: string) => Promise<void>
  summarizeBillingState: (
    userId: string,
  ) => Promise<AdminCustomerBillingSnapshot>
  recordAudit: (record: {
    targetUserId: string
    actorUserId: string
    action: StaffAccessGateAuditAction
    reason: string
    outcome: 'success' | 'failure'
    stripeOperationId: string | null
    beforeBillingState: AdminCustomerBillingSnapshot
    afterBillingState: AdminCustomerBillingSnapshot | null
  }) => Promise<{ id: string }>
}

export type AssignPermanentAccessGateInput = {
  userId: string
  actorUserId: string
  reason: string
}

export type AssignPermanentAccessGateResult = {
  accessGateId: string
  status: AccessGateStatus
  trialStart: Date
  trialEnd: null
  testerDemoted: boolean
  auditId: string
}

export type SetAccessGateTrialInput = {
  userId: string
  actorUserId: string
  reason: string
  amount: number
  unit: EntitlementExtensionDurationUnit
  direction?: EntitlementExtensionDirection
}

export type SetAccessGateTrialResult = {
  accessGateId: string
  status: AccessGateStatus
  mode: 'issued' | 'extended'
  previousTrialEnd: Date | null
  trialStart: Date
  trialEnd: Date
  auditId: string
}

export type RevokeAccessGateInput = {
  userId: string
  actorUserId: string
  reason: string
}

export type RevokeAccessGateResult = {
  accessGateId: string
  status: AccessGateStatus
  auditId: string
}

export class StaffAccessGateValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StaffAccessGateValidationError'
  }
}

export class StaffAccessGateCustomerNotFoundError extends Error {
  constructor(userId: string) {
    super(`Customer not found for user "${userId}".`)
    this.name = 'StaffAccessGateCustomerNotFoundError'
  }
}

export class StaffAccessGateConvertedError extends Error {
  constructor(userId: string) {
    super(
      `Customer for user "${userId}" already converted an Access Gate to paid.`,
    )
    this.name = 'StaffAccessGateConvertedError'
  }
}

export class StaffAccessGateOpenNotFoundError extends Error {
  constructor(userId: string) {
    super(`No open Access Gate found for user "${userId}".`)
    this.name = 'StaffAccessGateOpenNotFoundError'
  }
}

function assertReason(reason: string): void {
  const trimmed = reason.trim()
  if (trimmed.length < 3) {
    throw new StaffAccessGateValidationError(
      'Reason must be at least 3 characters.',
    )
  }
}

function assertActors(input: { userId: string; actorUserId: string }): void {
  if (!input.userId.trim()) {
    throw new StaffAccessGateValidationError('userId is required.')
  }
  if (!input.actorUserId.trim()) {
    throw new StaffAccessGateValidationError('actorUserId is required.')
  }
}

function assertTrialAmount(
  amount: number,
  unit: string,
): asserts unit is EntitlementExtensionDurationUnit {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new StaffAccessGateValidationError(
      'Trial amount must be a positive integer.',
    )
  }
  if (!isEntitlementExtensionDurationUnit(unit)) {
    throw new StaffAccessGateValidationError(
      'Trial unit must be days, weeks, or months.',
    )
  }
}

function resolveTrialDirection(
  direction: EntitlementExtensionDirection | undefined,
): EntitlementExtensionDirection {
  const resolved = direction ?? 'extend'
  if (!isEntitlementExtensionDirection(resolved)) {
    throw new StaffAccessGateValidationError(
      'Trial direction must be extend or reduce.',
    )
  }
  return resolved
}

export async function assertStaffActionsAllowed(
  store: StaffAccessGateStore,
  userId: string,
): Promise<void> {
  if (await store.userHasConvertedAccessGate(userId)) {
    throw new StaffAccessGateConvertedError(userId)
  }
}

/**
 * Shared shape for every staff Access Gate action: resolve the target user,
 * block on a converted gate, snapshot billing state around the mutation, and
 * record the audit entry.
 */
async function performAuditedStaffAction<T>(
  store: StaffAccessGateStore,
  input: { userId: string; actorUserId: string; reason: string },
  action: StaffAccessGateAuditAction,
  mutate: (user: StaffAccessGateTargetUser) => Promise<T>,
): Promise<{ user: StaffAccessGateTargetUser; result: T; auditId: string }> {
  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new StaffAccessGateCustomerNotFoundError(input.userId)
  }

  await assertStaffActionsAllowed(store, user.id)

  const beforeBillingState = await store.summarizeBillingState(user.id)
  const result = await mutate(user)
  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action,
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: null,
    beforeBillingState,
    afterBillingState,
  })

  return { user, result, auditId: audit.id }
}

function extensionBaseFromAccessGate(now: Date, gate: AccessGateRecord): Date {
  if (gate.trialEnd != null && gate.trialEnd.getTime() > now.getTime()) {
    return gate.trialEnd
  }
  return now
}

export async function demoteTesterIfNeeded(
  store: StaffAccessGateStore,
  user: Pick<StaffAccessGateTargetUser, 'id' | 'role'>,
): Promise<boolean> {
  if (user.role !== 'tester') return false
  await store.updateRoleToUser(user.id)
  return true
}

/** Upsert a permanent (`granted`, no trial end) Access Gate row without audit. */
export async function upsertPermanentAccessGate(
  store: StaffAccessGateStore,
  userId: string,
  runtime: { now?: () => Date } = {},
): Promise<AccessGateRecord> {
  const now = runtime.now?.() ?? new Date()
  const open = await store.findOpenAccessGateByUserId(userId)
  if (open) {
    return store.updateAccessGate({
      accessGateId: open.id,
      status: 'granted',
      trialEnd: null,
    })
  }
  return store.createAccessGate({
    userId,
    trialStart: now,
    trialEnd: null,
    status: 'granted',
  })
}

export async function assignPermanentAccessGateToCustomer(
  store: StaffAccessGateStore,
  input: AssignPermanentAccessGateInput,
  runtime: { now?: () => Date } = {},
): Promise<AssignPermanentAccessGateResult> {
  assertActors(input)
  assertReason(input.reason)

  const now = runtime.now?.() ?? new Date()
  let testerDemoted = false
  const { result: saved, auditId } = await performAuditedStaffAction(
    store,
    input,
    'assign_permanent_access_gate',
    async (user) => {
      testerDemoted = await demoteTesterIfNeeded(store, user)
      return upsertPermanentAccessGate(store, user.id, { now: () => now })
    },
  )

  return {
    accessGateId: saved.id,
    status: saved.status,
    trialStart: saved.trialStart ?? now,
    trialEnd: null,
    testerDemoted,
    auditId,
  }
}

export async function setAccessGateTrialForCustomer(
  store: StaffAccessGateStore,
  input: SetAccessGateTrialInput,
  runtime: { now?: () => Date } = {},
): Promise<SetAccessGateTrialResult> {
  assertActors(input)
  assertReason(input.reason)
  assertTrialAmount(input.amount, input.unit)
  const direction = resolveTrialDirection(input.direction)
  const now = runtime.now?.() ?? new Date()

  let previousTrialEnd: Date | null = null
  let hadOpenTrial = false
  let trialEndFallback: Date = now

  const { result: saved, auditId } = await performAuditedStaffAction(
    store,
    input,
    'set_access_gate_trial',
    async (user) => {
      const open = await store.findOpenAccessGateByUserId(user.id)
      previousTrialEnd = open?.trialEnd ?? null
      hadOpenTrial = open?.trialEnd != null

      const base = open ? extensionBaseFromAccessGate(now, open) : now
      const trialEnd = computeExtensionTrialEnd(
        base,
        input.amount,
        input.unit,
        direction,
      )
      if (direction === 'reduce' && trialEnd.getTime() <= now.getTime()) {
        throw new StaffAccessGateValidationError(
          'Reducing by this amount would end the Access Gate in the past. Reduce by less, or revoke the gate instead.',
        )
      }
      trialEndFallback = trialEnd

      return open
        ? store.updateAccessGate({
            accessGateId: open.id,
            status: 'trialing',
            trialStart: open.trialStart ?? now,
            trialEnd,
          })
        : store.createAccessGate({
            userId: user.id,
            trialStart: now,
            trialEnd,
            status: accessGateStatusForIssue(trialEnd),
          })
    },
  )

  return {
    accessGateId: saved.id,
    status: saved.status,
    mode: hadOpenTrial ? 'extended' : 'issued',
    previousTrialEnd,
    trialStart: saved.trialStart ?? now,
    trialEnd: saved.trialEnd ?? trialEndFallback,
    auditId,
  }
}

export async function revokeAccessGateForCustomer(
  store: StaffAccessGateStore,
  input: RevokeAccessGateInput,
): Promise<RevokeAccessGateResult> {
  assertActors(input)
  assertReason(input.reason)

  const { result: revoked, auditId } = await performAuditedStaffAction(
    store,
    input,
    'revoke_access_gate',
    async (user) => {
      const open = await store.findOpenAccessGateByUserId(user.id)
      if (!open) {
        throw new StaffAccessGateOpenNotFoundError(user.id)
      }
      return store.revokeAccessGate({ userId: user.id })
    },
  )

  return {
    accessGateId: revoked.id,
    status: revoked.status,
    auditId,
  }
}

const STAFF_ACCESS_GATE_ACTION_LABELS = {
  assign_permanent_access_gate: 'Assign permanent Access Gate',
  set_access_gate_trial: 'Set Access Gate trial',
  revoke_access_gate: 'Revoke Access Gate',
} as const satisfies Record<StaffAccessGateAuditAction, string>

export function formatStaffAccessGateActionLabel(
  action: StaffAccessGateAuditAction,
): string {
  return STAFF_ACCESS_GATE_ACTION_LABELS[action]
}

export function isStaffAccessGateAuditAction(
  value: string,
): value is StaffAccessGateAuditAction {
  return (STAFF_ACCESS_GATE_AUDIT_ACTIONS as readonly string[]).includes(value)
}
