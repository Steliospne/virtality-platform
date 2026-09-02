import {
  computeExtensionTrialEnd,
  isEntitlementExtensionDurationUnit,
  type EntitlementExtensionDurationUnit,
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
    code: string
  }) => Promise<TrialGrantRecord>
  startTrialGrant: (input: {
    userId: string
    trialStart: Date
    trialEnd: Date
  }) => Promise<TrialGrantRecord>
  convertActiveTrialGrantByUserId: (
    userId: string,
  ) => Promise<TrialGrantRecord | null>
  summarizeBillingState: (
    userId: string,
  ) => Promise<AdminCustomerBillingSnapshot>
  recordAudit: (record: {
    targetUserId: string
    actorUserId: string
    action: 'issue_trial_grant' | 'start_trial_grant'
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

export class TrialGrantNotFoundError extends Error {
  constructor(userId: string) {
    super(`No pending TrialGrant found for user "${userId}".`)
    this.name = 'TrialGrantNotFoundError'
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

  if (!Number.isInteger(input.amount) || input.amount < 1) {
    throw new TrialGrantValidationError(
      'Trial amount must be a positive integer.',
    )
  }
  if (!isEntitlementExtensionDurationUnit(input.unit)) {
    throw new TrialGrantValidationError(
      'Trial unit must be days, weeks, or months.',
    )
  }

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
