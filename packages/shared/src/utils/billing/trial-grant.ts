import { computeExtensionTrialEnd } from './entitlement-extension.ts'
import type { EntitlementClockStanding } from './entitlement-clock.ts'
import { isDefaultSubscriptionPlan } from './billing-plans.ts'
import {
  accessGateStatusForIssue,
  resolveAccessGateClock,
  type AccessGateClock,
  type AccessGateOpenStatus,
  type AccessGateRecord,
  type AccessGateStatus,
} from './access-gate.ts'

export {
  ACCESS_GATE_OPEN_STATUSES,
  ACCESS_GATE_STATUSES,
  accessGateStatusForIssue,
  clockEndForAccessGate,
  clockEndForEntitlementSource,
  isAccessGateOpenStatus,
  resolveAccessGateClock,
  resolveEntitlementFromSources,
  toAccessGateClock,
  type AccessGateClock,
  type AccessGateOpenStatus,
  type AccessGateRecord,
  type AccessGateStatus,
} from './access-gate.ts'

/** @deprecated Use `ACCESS_GATE_STATUSES`. */
export { ACCESS_GATE_STATUSES as TRIAL_GRANT_STATUSES } from './access-gate.ts'

/** @deprecated Use `AccessGateStatus`. */
export type TrialGrantStatus = AccessGateStatus

/** @deprecated Use `ACCESS_GATE_OPEN_STATUSES`. */
export { ACCESS_GATE_OPEN_STATUSES as TRIAL_GRANT_OPEN_STATUSES } from './access-gate.ts'

/** @deprecated Use `AccessGateOpenStatus`. */
export type TrialGrantOpenStatus = AccessGateOpenStatus

/** @deprecated Use `isAccessGateOpenStatus`. */
export { isAccessGateOpenStatus as isTrialGrantOpenStatus } from './access-gate.ts'

/** @deprecated Use `AccessGateClock`. */
export type TrialGrantClock = AccessGateClock

/** @deprecated Use `AccessGateRecord`. */
export type TrialGrantRecord = AccessGateRecord

/** @deprecated Use `resolveAccessGateClock`. */
export function resolveTrialGrantClock(input: {
  now: Date
  trialGrant: AccessGateClock | null
}): EntitlementClockStanding {
  return resolveAccessGateClock({
    now: input.now,
    accessGate: input.trialGrant,
  })
}

/** @deprecated Use `clockEndForAccessGate`. */
export { clockEndForAccessGate as clockEndForTrialGrant } from './access-gate.ts'

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
    isDefaultSubscriptionPlan(subscription.plan) &&
    Boolean(subscription.stripeSubscriptionId?.trim())
  )
}

export type TrialGrantStore = {
  findOpenTrialGrantByUserId: (
    userId: string,
  ) => Promise<TrialGrantRecord | null>
  findOpenTimedAccessGateByUserId: (
    userId: string,
  ) => Promise<TrialGrantRecord | null>
  findOpenGrantedAccessGateByUserId: (
    userId: string,
  ) => Promise<TrialGrantRecord | null>
  createTrialGrant: (input: {
    userId: string
    trialStart: Date
    trialEnd: Date | null
    status: AccessGateOpenStatus
  }) => Promise<TrialGrantRecord>
  convertActiveTrialGrantByUserId: (
    userId: string,
  ) => Promise<TrialGrantRecord | null>
  userHasLiveDefaultSubscription: (userId: string) => Promise<boolean>
}

export type GrantActiveTrialInput = {
  userId: string
  trialDays: number
}

export type GrantActiveTrialResult = {
  accessGateId: string
  /** @deprecated Use `accessGateId`. */
  trialGrantId: string
  status: TrialGrantStatus
  trialStart: Date
  trialEnd: Date
}

export type IssueFreeGrantInput = {
  userId: string
}

export type IssueFreeGrantResult = {
  accessGateId: string
  status: TrialGrantStatus
  trialStart: Date
  trialEnd: null
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

export class TrialGrantAlreadyOpenError extends Error {
  constructor(userId: string) {
    super(`User "${userId}" already has an open TrialGrant.`)
    this.name = 'TrialGrantAlreadyOpenError'
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

/**
 * Self-serve Access Code redemption path: creates a fresh timed Access Gate row
 * when no open timed gate exists and the user has no live Default subscription.
 */
export async function grantActiveTrialToUser(
  store: Pick<
    TrialGrantStore,
    | 'findOpenTimedAccessGateByUserId'
    | 'createTrialGrant'
    | 'userHasLiveDefaultSubscription'
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

  const existingTimed = await store.findOpenTimedAccessGateByUserId(
    input.userId,
  )
  if (existingTimed) {
    throw new TrialGrantAlreadyOpenError(input.userId)
  }

  const entitled = await store.userHasLiveDefaultSubscription(input.userId)
  if (entitled) {
    throw new TrialGrantCustomerAlreadyEntitledError(input.userId)
  }

  const now = runtime.now?.() ?? new Date()
  const trialEnd = computeExtensionTrialEnd(now, input.trialDays, 'days')
  const created = await store.createTrialGrant({
    userId: input.userId,
    trialStart: now,
    trialEnd,
    status: accessGateStatusForIssue(trialEnd),
  })

  return {
    accessGateId: created.id,
    trialGrantId: created.id,
    status: created.status,
    trialStart: created.trialStart ?? now,
    trialEnd: created.trialEnd ?? trialEnd,
  }
}

/**
 * Self-serve Permanent Access Gate issuance for Access Code redemption. Always
 * creates a new row; callers enforce the profile redemption matrix.
 */
export async function issueFreeGrantToUser(
  store: Pick<
    TrialGrantStore,
    'createTrialGrant' | 'userHasLiveDefaultSubscription'
  >,
  input: IssueFreeGrantInput,
  runtime: { now?: () => Date } = {},
): Promise<IssueFreeGrantResult> {
  if (!input.userId.trim()) {
    throw new TrialGrantValidationError('userId is required.')
  }

  const entitled = await store.userHasLiveDefaultSubscription(input.userId)
  if (entitled) {
    throw new TrialGrantCustomerAlreadyEntitledError(input.userId)
  }

  const now = runtime.now?.() ?? new Date()
  const created = await store.createTrialGrant({
    userId: input.userId,
    trialStart: now,
    trialEnd: null,
    status: 'granted',
  })

  return {
    accessGateId: created.id,
    status: created.status,
    trialStart: created.trialStart ?? now,
    trialEnd: null,
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

export const TRIAL_GRANT_STATUS_LABELS: Record<TrialGrantStatus, string> = {
  granted: 'Granted',
  trialing: 'Trialing',
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
  const standing = resolveAccessGateClock({
    now: input.now,
    accessGate: input.grant,
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
