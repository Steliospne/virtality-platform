import {
  computeExtensionTrialEnd,
  isEntitlementExtensionDurationUnit,
  type EntitlementExtensionDurationUnit,
  type EntitlementExtensionDirection,
  isEntitlementExtensionDirection,
} from './entitlement-extension.ts'
import type { EntitlementClockStanding } from './entitlement-clock.ts'
import {
  clockEndForSubscriptionStatus,
  pickEntitlementSubscription,
  resolveEntitlementClock,
  type EntitlementClockSubscription,
} from './entitlement-clock.ts'
import type { AdminCustomerBillingSnapshot } from '../admin-customer/admin-customer-access.ts'

export const TRIAL_GRANT_STATUSES = [
  'pending',
  'active',
  'converted',
  'revoked',
] as const

export type TrialGrantStatus = (typeof TRIAL_GRANT_STATUSES)[number]

export const TRIAL_GRANT_OPEN_STATUSES = ['pending', 'active'] as const

export type TrialGrantOpenStatus = (typeof TRIAL_GRANT_OPEN_STATUSES)[number]

export type TrialGrantClock = {
  status: TrialGrantStatus
  trialStart: Date | null
  trialEnd: Date | null
}

export type TrialGrantRecord = TrialGrantClock & {
  id: string
  userId: string
  code: string
}

function expiredTrialGrantStanding(
  status: string | null,
): EntitlementClockStanding {
  return {
    entitled: false,
    clockEnd: null,
    remainingMs: 0,
    status,
  }
}

export function userHasStripeSubscriptionForEntitlement(
  subscriptions: readonly EntitlementClockSubscription[],
): boolean {
  return subscriptions.length > 0
}

export function resolveTrialGrantClock(input: {
  now: Date
  trialGrant: TrialGrantClock | null
}): EntitlementClockStanding {
  const grant = input.trialGrant
  if (!grant || grant.status !== 'active') {
    return expiredTrialGrantStanding(grant?.status ?? null)
  }

  if (grant.trialStart == null || grant.trialEnd == null) {
    return expiredTrialGrantStanding('active')
  }

  const clockEnd = grant.trialEnd
  const remainingMs = Math.max(0, clockEnd.getTime() - input.now.getTime())
  const entitled = remainingMs > 0

  return {
    entitled,
    clockEnd: entitled ? clockEnd : null,
    remainingMs,
    status: entitled ? 'trialing' : 'active',
  }
}

export function clockEndForTrialGrant(
  trialGrant: TrialGrantClock | null | undefined,
): Date | null {
  if (!trialGrant || trialGrant.status !== 'active') return null
  return trialGrant.trialEnd ?? null
}

export function resolveEntitlementFromSources(input: {
  now: Date
  subscriptions: readonly EntitlementClockSubscription[]
  trialGrant?: TrialGrantClock | null
}): EntitlementClockStanding {
  if (userHasStripeSubscriptionForEntitlement(input.subscriptions)) {
    const subscription = pickEntitlementSubscription(input.subscriptions)
    return resolveEntitlementClock({
      now: input.now,
      subscription,
    })
  }

  return resolveTrialGrantClock({
    now: input.now,
    trialGrant: input.trialGrant ?? null,
  })
}

export function clockEndForEntitlementSource(input: {
  subscriptions: readonly EntitlementClockSubscription[]
  trialGrant?: TrialGrantClock | null
}): Date | null {
  if (userHasStripeSubscriptionForEntitlement(input.subscriptions)) {
    const subscription = pickEntitlementSubscription(input.subscriptions)
    if (!subscription) return null
    return clockEndForSubscriptionStatus(
      subscription.status,
      subscription.trialEnd,
      subscription.periodEnd,
    )
  }

  return clockEndForTrialGrant(input.trialGrant ?? null)
}

export type TrialGrantTargetUser = {
  id: string
  name: string
  email: string
  role: string | null
}

export type TrialGrantStore = {
  findTargetUser: (userId: string) => Promise<TrialGrantTargetUser | null>
  findOpenTrialGrantByUserId: (
    userId: string,
  ) => Promise<TrialGrantRecord | null>
  createTrialGrant: (input: {
    userId: string
    code: string
  }) => Promise<TrialGrantRecord>
  startTrialGrant: (input: {
    userId: string
    trialStart: Date
    trialEnd: Date
  }) => Promise<TrialGrantRecord>
  adjustTrialGrant: (input: {
    userId: string
    trialEnd: Date
  }) => Promise<TrialGrantRecord>
  revokeTrialGrant: (input: { userId: string }) => Promise<TrialGrantRecord>
  summarizeBillingState: (
    userId: string,
  ) => Promise<AdminCustomerBillingSnapshot>
  recordAudit: (record: {
    targetUserId: string
    actorUserId: string
    action:
      | 'issue_trial_grant'
      | 'start_trial_grant'
      | 'adjust_trial_grant'
      | 'revoke_trial_grant'
    reason: string
    outcome: 'success' | 'failure'
    stripeOperationId: string | null
    beforeBillingState: AdminCustomerBillingSnapshot
    afterBillingState: AdminCustomerBillingSnapshot | null
  }) => Promise<{ id: string }>
  userHasLiveProSubscription: (userId: string) => Promise<boolean>
}

export type IssueTrialGrantInput = {
  userId: string
  actorUserId: string
  reason: string
  code: string
}

export type StartTrialGrantInput = {
  userId: string
  actorUserId: string
  reason: string
  amount: number
  unit: EntitlementExtensionDurationUnit
}

export type IssueTrialGrantResult = {
  trialGrantId: string
  code: string
  status: TrialGrantStatus
  auditId: string
}

export type StartTrialGrantResult = {
  trialGrantId: string
  status: TrialGrantStatus
  trialStart: Date
  trialEnd: Date
  auditId: string
}

export type AdjustTrialGrantInput = {
  userId: string
  actorUserId: string
  reason: string
  amount: number
  unit: EntitlementExtensionDurationUnit
  direction?: EntitlementExtensionDirection
}

export type AdjustTrialGrantResult = {
  trialGrantId: string
  status: TrialGrantStatus
  previousTrialEnd: Date
  trialEnd: Date
  auditId: string
}

export type RevokeTrialGrantInput = {
  userId: string
  actorUserId: string
  reason: string
}

export type RevokeTrialGrantResult = {
  trialGrantId: string
  status: TrialGrantStatus
  auditId: string
}

export class TrialGrantValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TrialGrantValidationError'
  }
}

export class TrialGrantNotFoundError extends Error {
  constructor(userId: string) {
    super(`No pending TrialGrant found for user "${userId}".`)
    this.name = 'TrialGrantNotFoundError'
  }
}

export class TrialGrantNotActiveError extends Error {
  constructor(userId: string) {
    super(`No active TrialGrant found for user "${userId}".`)
    this.name = 'TrialGrantNotActiveError'
  }
}

export class TrialGrantOpenNotFoundError extends Error {
  constructor(userId: string) {
    super(`No pending or active TrialGrant found for user "${userId}".`)
    this.name = 'TrialGrantOpenNotFoundError'
  }
}

export class TrialGrantAlreadyOpenError extends Error {
  constructor(userId: string) {
    super(`User "${userId}" already has a pending or active TrialGrant.`)
    this.name = 'TrialGrantAlreadyOpenError'
  }
}

export class TrialGrantCustomerNotFoundError extends Error {
  constructor(userId: string) {
    super(`Customer not found for user "${userId}".`)
    this.name = 'TrialGrantCustomerNotFoundError'
  }
}

export class TrialGrantCustomerAlreadyEntitledError extends Error {
  constructor(userId: string) {
    super(
      `Customer for user "${userId}" already has a trialing or active Subscription.`,
    )
    this.name = 'TrialGrantCustomerAlreadyEntitledError'
  }
}

function assertReason(reason: string): void {
  const trimmed = reason.trim()
  if (trimmed.length < 3) {
    throw new TrialGrantValidationError('Reason must be at least 3 characters.')
  }
}

function assertActors(input: { userId: string; actorUserId: string }): void {
  if (!input.userId.trim()) {
    throw new TrialGrantValidationError('userId is required.')
  }
  if (!input.actorUserId.trim()) {
    throw new TrialGrantValidationError('actorUserId is required.')
  }
}

function assertTrialExtensionAmount(
  amount: number,
  unit: string,
): asserts unit is EntitlementExtensionDurationUnit {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new TrialGrantValidationError(
      'Trial amount must be a positive integer.',
    )
  }
  if (!isEntitlementExtensionDurationUnit(unit)) {
    throw new TrialGrantValidationError(
      'Trial unit must be days, weeks, or months.',
    )
  }
}

function resolveTrialExtensionDirection(
  direction: EntitlementExtensionDirection | undefined,
): EntitlementExtensionDirection {
  const resolved = direction ?? 'extend'
  if (!isEntitlementExtensionDirection(resolved)) {
    throw new TrialGrantValidationError(
      'Trial direction must be extend or reduce.',
    )
  }
  return resolved
}

export async function issueTrialGrantToCustomer(
  store: TrialGrantStore,
  input: IssueTrialGrantInput,
): Promise<IssueTrialGrantResult> {
  assertActors(input)
  assertReason(input.reason)

  const code = input.code.trim()
  if (!code) {
    throw new TrialGrantValidationError('code is required.')
  }

  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new TrialGrantCustomerNotFoundError(input.userId)
  }

  const beforeBillingState = await store.summarizeBillingState(user.id)
  const existing = await store.findOpenTrialGrantByUserId(user.id)
  if (existing) {
    throw new TrialGrantAlreadyOpenError(user.id)
  }

  const entitled = await store.userHasLiveProSubscription(user.id)
  if (entitled) {
    throw new TrialGrantCustomerAlreadyEntitledError(user.id)
  }

  const created = await store.createTrialGrant({
    userId: user.id,
    code,
  })

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'issue_trial_grant',
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: null,
    beforeBillingState,
    afterBillingState,
  })

  return {
    trialGrantId: created.id,
    code: created.code,
    status: created.status,
    auditId: audit.id,
  }
}

export async function startTrialGrantForCustomer(
  store: TrialGrantStore,
  input: StartTrialGrantInput,
  runtime: { now?: () => Date } = {},
): Promise<StartTrialGrantResult> {
  assertActors(input)
  assertReason(input.reason)
  assertTrialExtensionAmount(input.amount, input.unit)

  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new TrialGrantCustomerNotFoundError(input.userId)
  }

  const beforeBillingState = await store.summarizeBillingState(user.id)
  const pending = await store.findOpenTrialGrantByUserId(user.id)
  if (!pending || pending.status !== 'pending') {
    throw new TrialGrantNotFoundError(user.id)
  }

  const now = runtime.now?.() ?? new Date()
  const trialEnd = computeExtensionTrialEnd(now, input.amount, input.unit)
  const started = await store.startTrialGrant({
    userId: user.id,
    trialStart: now,
    trialEnd,
  })

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'start_trial_grant',
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: null,
    beforeBillingState,
    afterBillingState,
  })

  return {
    trialGrantId: started.id,
    status: started.status,
    trialStart: started.trialStart ?? now,
    trialEnd: started.trialEnd ?? trialEnd,
    auditId: audit.id,
  }
}

function extensionBaseFromTrialGrant(now: Date, grant: TrialGrantClock): Date {
  // Use the current trial end when it is still in the future; otherwise now.
  if (grant.trialEnd != null && grant.trialEnd.getTime() > now.getTime()) {
    return grant.trialEnd
  }
  return now
}

export async function adjustTrialGrantForCustomer(
  store: TrialGrantStore,
  input: AdjustTrialGrantInput,
  runtime: { now?: () => Date } = {},
): Promise<AdjustTrialGrantResult> {
  assertActors(input)
  assertReason(input.reason)
  assertTrialExtensionAmount(input.amount, input.unit)
  const direction = resolveTrialExtensionDirection(input.direction)

  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new TrialGrantCustomerNotFoundError(input.userId)
  }

  const beforeBillingState = await store.summarizeBillingState(user.id)
  const active = await store.findOpenTrialGrantByUserId(user.id)
  if (!active || active.status !== 'active' || active.trialEnd == null) {
    throw new TrialGrantNotActiveError(user.id)
  }

  const now = runtime.now?.() ?? new Date()
  const previousTrialEnd = active.trialEnd
  const trialEnd = computeExtensionTrialEnd(
    extensionBaseFromTrialGrant(now, active),
    input.amount,
    input.unit,
    direction,
  )
  if (direction === 'reduce' && trialEnd.getTime() <= now.getTime()) {
    throw new TrialGrantValidationError(
      'Reducing by this amount would end the Trial Grant in the past. Reduce by less, or revoke the grant instead.',
    )
  }

  const adjusted = await store.adjustTrialGrant({
    userId: user.id,
    trialEnd,
  })

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'adjust_trial_grant',
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: null,
    beforeBillingState,
    afterBillingState,
  })

  return {
    trialGrantId: adjusted.id,
    status: adjusted.status,
    previousTrialEnd,
    trialEnd: adjusted.trialEnd ?? trialEnd,
    auditId: audit.id,
  }
}

export async function revokeTrialGrantForCustomer(
  store: TrialGrantStore,
  input: RevokeTrialGrantInput,
): Promise<RevokeTrialGrantResult> {
  assertActors(input)
  assertReason(input.reason)

  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new TrialGrantCustomerNotFoundError(input.userId)
  }

  const beforeBillingState = await store.summarizeBillingState(user.id)
  const open = await store.findOpenTrialGrantByUserId(user.id)
  if (!open) {
    throw new TrialGrantOpenNotFoundError(user.id)
  }

  const revoked = await store.revokeTrialGrant({
    userId: user.id,
  })

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'revoke_trial_grant',
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: null,
    beforeBillingState,
    afterBillingState,
  })

  return {
    trialGrantId: revoked.id,
    status: revoked.status,
    auditId: audit.id,
  }
}
