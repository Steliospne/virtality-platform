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
export { ACCESS_GATE_STATUSES as ACCESS_GRANT_STATUSES } from './access-gate.ts'

/** @deprecated Use `AccessGateStatus`. */
export type AccessGrantStatus = AccessGateStatus

/** @deprecated Use `ACCESS_GATE_OPEN_STATUSES`. */
export { ACCESS_GATE_OPEN_STATUSES as ACCESS_GRANT_OPEN_STATUSES } from './access-gate.ts'

/** @deprecated Use `AccessGateOpenStatus`. */
export type AccessGrantOpenStatus = AccessGateOpenStatus

/** @deprecated Use `isAccessGateOpenStatus`. */
export { isAccessGateOpenStatus as isAccessGrantOpenStatus } from './access-gate.ts'

/** @deprecated Use `AccessGateClock`. */
export type AccessGrantClock = AccessGateClock

/** @deprecated Use `AccessGateRecord`. */
export type AccessGrantRecord = AccessGateRecord

/** @deprecated Use `resolveAccessGateClock`. */
export function resolveAccessGrantClock(input: {
  now: Date
  accessGrant: AccessGateClock | null
}): EntitlementClockStanding {
  return resolveAccessGateClock({
    now: input.now,
    accessGate: input.accessGrant,
  })
}

/** @deprecated Use `clockEndForAccessGate`. */
export { clockEndForAccessGate as clockEndForAccessGrant } from './access-gate.ts'

export type PaidStripeSubscriptionForAccessGrantConversion = {
  plan?: string | null
  stripeSubscriptionId?: string | null
}

export type ConvertActiveAccessGrantInput = {
  userId: string
  subscription: PaidStripeSubscriptionForAccessGrantConversion
}

export function isPaidStripeSubscriptionForAccessGrantConversion(
  subscription: PaidStripeSubscriptionForAccessGrantConversion,
): boolean {
  return (
    isDefaultSubscriptionPlan(subscription.plan) &&
    Boolean(subscription.stripeSubscriptionId?.trim())
  )
}

export type AccessGrantStore = {
  findOpenAccessGrantByUserId: (
    userId: string,
  ) => Promise<AccessGrantRecord | null>
  findOpenTimedAccessGateByUserId: (
    userId: string,
  ) => Promise<AccessGrantRecord | null>
  findOpenGrantedAccessGateByUserId: (
    userId: string,
  ) => Promise<AccessGrantRecord | null>
  createAccessGrant: (input: {
    userId: string
    trialStart: Date
    trialEnd: Date | null
    status: AccessGateOpenStatus
  }) => Promise<AccessGrantRecord>
  convertActiveAccessGrantByUserId: (
    userId: string,
  ) => Promise<AccessGrantRecord | null>
  userHasLiveDefaultSubscription: (userId: string) => Promise<boolean>
}

export type GrantActiveTrialInput = {
  userId: string
  trialDays: number
}

export type GrantActiveTrialResult = {
  accessGateId: string
  /** @deprecated Use `accessGateId`. */
  accessGrantId: string
  status: AccessGrantStatus
  trialStart: Date
  trialEnd: Date
}

export type IssueFreeGrantInput = {
  userId: string
}

export type IssueFreeGrantResult = {
  accessGateId: string
  status: AccessGrantStatus
  trialStart: Date
  trialEnd: null
}

export type ConvertActiveAccessGrantResult = {
  converted: boolean
  accessGrantId?: string
}

export class AccessGrantValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AccessGrantValidationError'
  }
}

export class AccessGrantAlreadyOpenError extends Error {
  constructor(userId: string) {
    super(`User "${userId}" already has an open AccessGrant.`)
    this.name = 'AccessGrantAlreadyOpenError'
  }
}

export class AccessGrantCustomerAlreadyEntitledError extends Error {
  constructor(userId: string) {
    super(
      `Customer for user "${userId}" already has a trialing or active Subscription.`,
    )
    this.name = 'AccessGrantCustomerAlreadyEntitledError'
  }
}

/**
 * Self-serve Access Code redemption path: creates a fresh timed Access Gate row
 * when no open timed gate exists and the user has no live Default subscription.
 */
export async function grantActiveTrialToUser(
  store: Pick<
    AccessGrantStore,
    | 'findOpenTimedAccessGateByUserId'
    | 'createAccessGrant'
    | 'userHasLiveDefaultSubscription'
  >,
  input: GrantActiveTrialInput,
  runtime: { now?: () => Date } = {},
): Promise<GrantActiveTrialResult> {
  if (!input.userId.trim()) {
    throw new AccessGrantValidationError('userId is required.')
  }
  if (!Number.isInteger(input.trialDays) || input.trialDays < 1) {
    throw new AccessGrantValidationError(
      'Trial days must be a positive integer.',
    )
  }

  const existingTimed = await store.findOpenTimedAccessGateByUserId(
    input.userId,
  )
  if (existingTimed) {
    throw new AccessGrantAlreadyOpenError(input.userId)
  }

  const entitled = await store.userHasLiveDefaultSubscription(input.userId)
  if (entitled) {
    throw new AccessGrantCustomerAlreadyEntitledError(input.userId)
  }

  const now = runtime.now?.() ?? new Date()
  const trialEnd = computeExtensionTrialEnd(now, input.trialDays, 'days')
  const created = await store.createAccessGrant({
    userId: input.userId,
    trialStart: now,
    trialEnd,
    status: accessGateStatusForIssue(trialEnd),
  })

  return {
    accessGateId: created.id,
    accessGrantId: created.id,
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
    AccessGrantStore,
    'createAccessGrant' | 'userHasLiveDefaultSubscription'
  >,
  input: IssueFreeGrantInput,
  runtime: { now?: () => Date } = {},
): Promise<IssueFreeGrantResult> {
  if (!input.userId.trim()) {
    throw new AccessGrantValidationError('userId is required.')
  }

  const entitled = await store.userHasLiveDefaultSubscription(input.userId)
  if (entitled) {
    throw new AccessGrantCustomerAlreadyEntitledError(input.userId)
  }

  const now = runtime.now?.() ?? new Date()
  const created = await store.createAccessGrant({
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

export async function convertActiveAccessGrantOnPaidSubscription(
  store: Pick<AccessGrantStore, 'convertActiveAccessGrantByUserId'>,
  input: ConvertActiveAccessGrantInput,
): Promise<ConvertActiveAccessGrantResult> {
  if (!input.userId.trim()) {
    return { converted: false }
  }
  if (!isPaidStripeSubscriptionForAccessGrantConversion(input.subscription)) {
    return { converted: false }
  }

  const converted = await store.convertActiveAccessGrantByUserId(input.userId)
  if (!converted) {
    return { converted: false }
  }

  return {
    converted: true,
    accessGrantId: converted.id,
  }
}

export const ACCESS_GRANT_STATUS_LABELS: Record<AccessGrantStatus, string> = {
  granted: 'Granted',
  trialing: 'Trialing',
  converted: 'Converted to paid',
  revoked: 'Revoked',
}

export type AdminCustomerAccessGrantSummary = {
  id: string
  status: AccessGrantStatus
  trialStart: Date | null
  trialEnd: Date | null
  createdAt: Date
  remainingMs: number
  entitled: boolean
}

export function mapAdminCustomerAccessGrantSummary(input: {
  now: Date
  grant: AccessGrantRecord & { createdAt: Date }
}): AdminCustomerAccessGrantSummary {
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
