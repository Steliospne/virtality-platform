import {
  computeExtensionTrialEnd,
  isEntitlementExtensionDurationUnit,
  isLiveEntitlementSubscriptionStatus,
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
import { isProSubscriptionPlan } from './billing-plans.ts'
import type { AdminCustomerBillingSnapshot } from '../admin-customer/admin-customer-access.ts'

export const TRIAL_GRANT_STATUSES = ['active', 'converted', 'revoked'] as const

export type TrialGrantStatus = (typeof TRIAL_GRANT_STATUSES)[number]

export const TRIAL_GRANT_OPEN_STATUSES = ['active'] as const

export type TrialGrantOpenStatus = (typeof TRIAL_GRANT_OPEN_STATUSES)[number]

export function isTrialGrantOpenStatus(
  value: string,
): value is TrialGrantOpenStatus {
  return (TRIAL_GRANT_OPEN_STATUSES as readonly string[]).includes(value)
}

export type TrialGrantClock = {
  status: TrialGrantStatus
  trialStart: Date | null
  trialEnd: Date | null
}

export type TrialGrantRecord = TrialGrantClock & {
  id: string
  userId: string
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

/**
 * A live, paid (non-free) Stripe subscription - the only Stripe state that
 * should preempt an owned TrialGrant clock. A synced `free` plan row (e.g.
 * from "assign permanent Free") must not shadow an active trial.
 */
function userHasLivePaidSubscriptionForEntitlement(
  subscriptions: readonly EntitlementClockSubscription[],
): boolean {
  const subscription = pickEntitlementSubscription(subscriptions)
  if (!subscription) return false
  return (
    isLiveEntitlementSubscriptionStatus(subscription.status) &&
    isProSubscriptionPlan(subscription.plan)
  )
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
  // A live paid Stripe subscription always wins. Otherwise a currently-live
  // TrialGrant wins even when the customer also has an inert Stripe row
  // (e.g. a synced `free` plan subscription from "assign permanent Free") -
  // otherwise that row would shadow the trial clock and the customer would
  // never show as entitled/trialing.
  if (userHasLivePaidSubscriptionForEntitlement(input.subscriptions)) {
    const subscription = pickEntitlementSubscription(input.subscriptions)
    return resolveEntitlementClock({
      now: input.now,
      subscription,
    })
  }

  const trialStanding = resolveTrialGrantClock({
    now: input.now,
    trialGrant: input.trialGrant ?? null,
  })
  if (trialStanding.entitled) {
    return trialStanding
  }

  if (userHasStripeSubscriptionForEntitlement(input.subscriptions)) {
    const subscription = pickEntitlementSubscription(input.subscriptions)
    return resolveEntitlementClock({
      now: input.now,
      subscription,
    })
  }

  return trialStanding
}

export function clockEndForEntitlementSource(input: {
  subscriptions: readonly EntitlementClockSubscription[]
  trialGrant?: TrialGrantClock | null
}): Date | null {
  if (userHasLivePaidSubscriptionForEntitlement(input.subscriptions)) {
    const subscription = pickEntitlementSubscription(input.subscriptions)
    if (!subscription) return null
    return clockEndForSubscriptionStatus(
      subscription.status,
      subscription.trialEnd,
      subscription.periodEnd,
    )
  }

  const trialClockEnd = clockEndForTrialGrant(input.trialGrant ?? null)
  if (trialClockEnd != null) {
    return trialClockEnd
  }

  if (userHasStripeSubscriptionForEntitlement(input.subscriptions)) {
    const subscription = pickEntitlementSubscription(input.subscriptions)
    if (!subscription) return null
    return clockEndForSubscriptionStatus(
      subscription.status,
      subscription.trialEnd,
      subscription.periodEnd,
    )
  }

  return trialClockEnd
}

export type TrialGrantTargetUser = {
  id: string
  name: string
  email: string
  role: string | null
}

export type PaidStripeSubscriptionForTrialGrantConversion = {
  plan?: string | null
  stripeSubscriptionId?: string | null
}

export type ConvertActiveTrialGrantInput = {
  userId: string
  subscription: PaidStripeSubscriptionForTrialGrantConversion
}

export function isPaidStripeSubscriptionForTrialGrantConversion(
  subscription: PaidStripeSubscriptionForTrialGrantConversion,
): boolean {
  return (
    isProSubscriptionPlan(subscription.plan) &&
    Boolean(subscription.stripeSubscriptionId?.trim())
  )
}

export type TrialGrantStore = {
  findTargetUser: (userId: string) => Promise<TrialGrantTargetUser | null>
  findOpenTrialGrantByUserId: (
    userId: string,
  ) => Promise<TrialGrantRecord | null>
  createTrialGrant: (input: {
    userId: string
    trialStart: Date
    trialEnd: Date
  }) => Promise<TrialGrantRecord>
  adjustTrialGrant: (input: {
    userId: string
    trialEnd: Date
  }) => Promise<TrialGrantRecord>
  revokeTrialGrant: (input: { userId: string }) => Promise<TrialGrantRecord>
  convertActiveTrialGrantByUserId: (
    userId: string,
  ) => Promise<TrialGrantRecord | null>
  summarizeBillingState: (
    userId: string,
  ) => Promise<AdminCustomerBillingSnapshot>
  recordAudit: (record: {
    targetUserId: string
    actorUserId: string
    action: 'issue_trial_grant' | 'adjust_trial_grant' | 'revoke_trial_grant'
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
  amount: number
  unit: EntitlementExtensionDurationUnit
}

export type IssueTrialGrantResult = {
  trialGrantId: string
  status: TrialGrantStatus
  trialStart: Date
  trialEnd: Date
  auditId: string
}

export type GrantActiveTrialInput = {
  userId: string
  trialDays: number
}

export type GrantActiveTrialResult = {
  trialGrantId: string
  status: TrialGrantStatus
  trialStart: Date
  trialEnd: Date
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

export type ConvertActiveTrialGrantResult = {
  converted: boolean
  trialGrantId?: string
}

export class TrialGrantValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TrialGrantValidationError'
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
    super(`No open TrialGrant found for user "${userId}".`)
    this.name = 'TrialGrantOpenNotFoundError'
  }
}

export class TrialGrantAlreadyOpenError extends Error {
  constructor(userId: string) {
    super(`User "${userId}" already has an open TrialGrant.`)
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
  runtime: { now?: () => Date } = {},
): Promise<IssueTrialGrantResult> {
  assertActors(input)
  assertReason(input.reason)
  assertTrialExtensionAmount(input.amount, input.unit)

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

  const now = runtime.now?.() ?? new Date()
  const trialEnd = computeExtensionTrialEnd(now, input.amount, input.unit)
  const created = await store.createTrialGrant({
    userId: user.id,
    trialStart: now,
    trialEnd,
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
    status: created.status,
    trialStart: created.trialStart ?? now,
    trialEnd: created.trialEnd ?? trialEnd,
    auditId: audit.id,
  }
}

/**
 * Self-serve counterpart to {@link issueTrialGrantToCustomer}: same open-grant
 * / live-Pro guards, but no actor/reason and no AdminCustomerAudit row. Used
 * by Access Code redemption (sign-up, Profile Billing, sign-in) rather than
 * admin action.
 */
export async function grantActiveTrialToUser(
  store: Pick<
    TrialGrantStore,
    | 'findOpenTrialGrantByUserId'
    | 'createTrialGrant'
    | 'userHasLiveProSubscription'
  >,
  input: GrantActiveTrialInput,
  runtime: { now?: () => Date } = {},
): Promise<GrantActiveTrialResult> {
  if (!input.userId.trim()) {
    throw new TrialGrantValidationError('userId is required.')
  }
  if (!Number.isInteger(input.trialDays) || input.trialDays < 1) {
    throw new TrialGrantValidationError(
      'Trial days must be a positive integer.',
    )
  }

  const existing = await store.findOpenTrialGrantByUserId(input.userId)
  if (existing) {
    throw new TrialGrantAlreadyOpenError(input.userId)
  }

  const entitled = await store.userHasLiveProSubscription(input.userId)
  if (entitled) {
    throw new TrialGrantCustomerAlreadyEntitledError(input.userId)
  }

  const now = runtime.now?.() ?? new Date()
  const trialEnd = computeExtensionTrialEnd(now, input.trialDays, 'days')
  const created = await store.createTrialGrant({
    userId: input.userId,
    trialStart: now,
    trialEnd,
  })

  return {
    trialGrantId: created.id,
    status: created.status,
    trialStart: created.trialStart ?? now,
    trialEnd: created.trialEnd ?? trialEnd,
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

export async function convertActiveTrialGrantOnPaidSubscription(
  store: Pick<TrialGrantStore, 'convertActiveTrialGrantByUserId'>,
  input: ConvertActiveTrialGrantInput,
): Promise<ConvertActiveTrialGrantResult> {
  if (!input.userId.trim()) {
    return { converted: false }
  }
  if (!isPaidStripeSubscriptionForTrialGrantConversion(input.subscription)) {
    return { converted: false }
  }

  const converted = await store.convertActiveTrialGrantByUserId(input.userId)
  if (!converted) {
    return { converted: false }
  }

  return {
    converted: true,
    trialGrantId: converted.id,
  }
}

export const ADMIN_CUSTOMER_TRIAL_GRANT_ACTIONS = [
  'issue_trial_grant',
  'adjust_trial_grant',
  'revoke_trial_grant',
] as const

export type AdminCustomerTrialGrantAction =
  (typeof ADMIN_CUSTOMER_TRIAL_GRANT_ACTIONS)[number]

export const TRIAL_GRANT_STATUS_LABELS: Record<TrialGrantStatus, string> = {
  active: 'Active',
  converted: 'Converted to paid',
  revoked: 'Revoked',
}

export type AdminCustomerTrialGrantSummary = {
  id: string
  status: TrialGrantStatus
  trialStart: Date | null
  trialEnd: Date | null
  createdAt: Date
  remainingMs: number
  entitled: boolean
}

export function mapAdminCustomerTrialGrantSummary(input: {
  now: Date
  grant: TrialGrantRecord & { createdAt: Date }
}): AdminCustomerTrialGrantSummary {
  const standing = resolveTrialGrantClock({
    now: input.now,
    trialGrant: input.grant,
  })

  return {
    id: input.grant.id,
    status: input.grant.status,
    trialStart: input.grant.trialStart,
    trialEnd: input.grant.trialEnd,
    createdAt: input.grant.createdAt,
    remainingMs: standing.remainingMs,
    entitled: standing.entitled,
  }
}

export function formatAdminCustomerTrialGrantActionLabel(
  action: AdminCustomerTrialGrantAction,
): string {
  switch (action) {
    case 'issue_trial_grant':
      return 'Issue trial grant'
    case 'adjust_trial_grant':
      return 'Adjust trial grant'
    case 'revoke_trial_grant':
      return 'Revoke trial grant'
  }
}

export function isAdminCustomerTrialGrantAction(
  value: string,
): value is AdminCustomerTrialGrantAction {
  return (ADMIN_CUSTOMER_TRIAL_GRANT_ACTIONS as readonly string[]).includes(
    value,
  )
}
