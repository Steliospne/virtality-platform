import {
  FREE_SUBSCRIPTION_PLAN,
  buildPermanentFreeSubscriptionCreateParams,
  buildFreeTimedTrialSubscriptionCreateParams,
} from './billing-plans.ts'
import {
  computeExtensionTrialEnd,
  isEntitlementExtensionDurationUnit,
  type EntitlementExtensionDurationUnit,
  type LiveSubscriptionRecord,
} from './entitlement-extension.ts'

export const ADMIN_CUSTOMER_ACCESS_ACTIONS = [
  'assign_permanent_free',
  'grant_timed_trial',
] as const

export type AdminCustomerAccessAction =
  (typeof ADMIN_CUSTOMER_ACCESS_ACTIONS)[number]

export type AdminCustomerBillingSnapshot = {
  role: string | null
  stripeCustomerId: string | null
  primaryPlan: string | null
  primaryStatus: string | null
  stripeSubscriptionId: string | null
  /** Effective Assigned Variant name (`basic` when storage is null). */
  assignedProVariant: string | null
}

export type AdminCustomerAuditRecord = {
  targetUserId: string
  actorUserId: string
  action: AdminCustomerAccessAction
  reason: string
  outcome: 'success' | 'failure'
  stripeOperationId: string | null
  beforeBillingState: AdminCustomerBillingSnapshot
  afterBillingState: AdminCustomerBillingSnapshot | null
}

export type AdminCustomerAccessTargetUser = {
  id: string
  name: string
  email: string
  role: string | null
  stripeCustomerId: string | null
}

export type AdminCustomerAccessStore = {
  findTargetUser: (
    userId: string,
  ) => Promise<AdminCustomerAccessTargetUser | null>
  updateStripeCustomerId: (
    userId: string,
    stripeCustomerId: string,
  ) => Promise<void>
  updateRoleToUser: (userId: string) => Promise<void>
  findLiveSubscriptionByUserId: (
    userId: string,
  ) => Promise<LiveSubscriptionRecord | null>
  summarizeBillingState: (
    userId: string,
  ) => Promise<AdminCustomerBillingSnapshot>
  recordAudit: (
    record: AdminCustomerAuditRecord,
  ) => Promise<{ id: string; record: AdminCustomerAuditRecord }>
}

export type AdminCustomerAccessStripeGateway = {
  createCustomer: (input: {
    email: string
    name: string
    metadata: Record<string, string>
  }) => Promise<{ customerId: string }>
  customerHasEntitledSubscription: (customerId: string) => Promise<boolean>
  createPermanentFreeSubscription: (input: {
    customerId: string
    priceId: string
    metadata: Record<string, string>
  }) => Promise<{ stripeSubscriptionId: string }>
  createTimedTrialSubscription: (input: {
    customerId: string
    priceId: string
    trialEndUnix: number
    metadata: Record<string, string>
  }) => Promise<{ stripeSubscriptionId: string; trialEndUnix: number }>
}

export type AssignPermanentFreeInput = {
  userId: string
  actorUserId: string
  reason: string
  priceId: string
}

export type GrantTimedTrialInput = {
  userId: string
  actorUserId: string
  reason: string
  amount: number
  unit: EntitlementExtensionDurationUnit
  priceId: string
}

export type AssignPermanentFreeResult = {
  stripeCustomerId: string
  stripeSubscriptionId: string
  testerDemoted: boolean
  auditId: string
}

export type GrantTimedTrialResult = {
  stripeCustomerId: string
  stripeSubscriptionId: string
  trialEnd: Date
  testerDemoted: boolean
  auditId: string
}

export class AdminCustomerAccessValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminCustomerAccessValidationError'
  }
}

export class AdminCustomerAccessNotFoundError extends Error {
  constructor(userId: string) {
    super(`Customer not found for user "${userId}".`)
    this.name = 'AdminCustomerAccessNotFoundError'
  }
}

export class AdminCustomerAccessAlreadyEntitledError extends Error {
  constructor(userId: string) {
    super(
      `Customer for user "${userId}" already has a trialing or active Subscription.`,
    )
    this.name = 'AdminCustomerAccessAlreadyEntitledError'
  }
}

function assertReason(reason: string): void {
  const trimmed = reason.trim()
  if (trimmed.length < 3) {
    throw new AdminCustomerAccessValidationError(
      'Reason must be at least 3 characters.',
    )
  }
}

function assertActors(input: { userId: string; actorUserId: string }): void {
  if (!input.userId.trim()) {
    throw new AdminCustomerAccessValidationError('userId is required.')
  }
  if (!input.actorUserId.trim()) {
    throw new AdminCustomerAccessValidationError('actorUserId is required.')
  }
}

function stripeAssignMetadata(input: {
  actorUserId: string
  action: AdminCustomerAccessAction
}): Record<string, string> {
  return {
    adminCustomerActorUserId: input.actorUserId,
    adminCustomerAction: input.action,
  }
}

async function ensureStripeCustomer(
  store: AdminCustomerAccessStore,
  stripe: AdminCustomerAccessStripeGateway,
  user: AdminCustomerAccessTargetUser,
  actorUserId: string,
): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId

  const created = await stripe.createCustomer({
    email: user.email,
    name: user.name,
    metadata: {
      virtalityUserId: user.id,
      adminCustomerActorUserId: actorUserId,
    },
  })
  await store.updateStripeCustomerId(user.id, created.customerId)
  return created.customerId
}

async function assertNoEntitledSubscription(
  stripe: AdminCustomerAccessStripeGateway,
  customerId: string,
  userId: string,
): Promise<void> {
  const entitled = await stripe.customerHasEntitledSubscription(customerId)
  if (entitled) {
    throw new AdminCustomerAccessAlreadyEntitledError(userId)
  }
}

async function demoteTesterIfNeeded(
  store: AdminCustomerAccessStore,
  user: AdminCustomerAccessTargetUser,
): Promise<boolean> {
  if (user.role !== 'tester') return false
  await store.updateRoleToUser(user.id)
  return true
}

type CustomerAccessGrantContext = {
  user: AdminCustomerAccessTargetUser
  beforeBillingState: AdminCustomerBillingSnapshot
  testerDemoted: boolean
  stripeCustomerId: string
}

async function prepareCustomerAccessGrant(
  store: AdminCustomerAccessStore,
  stripe: AdminCustomerAccessStripeGateway,
  input: { userId: string; actorUserId: string },
): Promise<CustomerAccessGrantContext> {
  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new AdminCustomerAccessNotFoundError(input.userId)
  }

  const beforeBillingState = await store.summarizeBillingState(user.id)
  const testerDemoted = await demoteTesterIfNeeded(store, user)
  const stripeCustomerId = await ensureStripeCustomer(
    store,
    stripe,
    user,
    input.actorUserId,
  )
  await assertNoEntitledSubscription(stripe, stripeCustomerId, user.id)

  return { user, beforeBillingState, testerDemoted, stripeCustomerId }
}

export async function assignPermanentFreeToCustomer(
  store: AdminCustomerAccessStore,
  stripe: AdminCustomerAccessStripeGateway,
  input: AssignPermanentFreeInput,
  _runtime: { now?: () => Date } = {},
): Promise<AssignPermanentFreeResult> {
  assertActors(input)
  assertReason(input.reason)
  if (!input.priceId.trim()) {
    throw new AdminCustomerAccessValidationError('priceId is required.')
  }

  const { user, beforeBillingState, testerDemoted, stripeCustomerId } =
    await prepareCustomerAccessGrant(store, stripe, input)

  const created = await stripe.createPermanentFreeSubscription({
    customerId: stripeCustomerId,
    priceId: input.priceId,
    metadata: stripeAssignMetadata({
      actorUserId: input.actorUserId,
      action: 'assign_permanent_free',
    }),
  })

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'assign_permanent_free',
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: created.stripeSubscriptionId,
    beforeBillingState,
    afterBillingState,
  })

  return {
    stripeCustomerId,
    stripeSubscriptionId: created.stripeSubscriptionId,
    testerDemoted,
    auditId: audit.id,
  }
}

export async function grantTimedTrialToCustomer(
  store: AdminCustomerAccessStore,
  stripe: AdminCustomerAccessStripeGateway,
  input: GrantTimedTrialInput,
  runtime: { now?: () => Date } = {},
): Promise<GrantTimedTrialResult> {
  assertActors(input)
  assertReason(input.reason)
  if (!input.priceId.trim()) {
    throw new AdminCustomerAccessValidationError('priceId is required.')
  }
  if (!Number.isInteger(input.amount) || input.amount < 1) {
    throw new AdminCustomerAccessValidationError(
      'Trial amount must be a positive integer.',
    )
  }
  if (!isEntitlementExtensionDurationUnit(input.unit)) {
    throw new AdminCustomerAccessValidationError(
      'Trial unit must be days, weeks, or months.',
    )
  }

  const now = runtime.now?.() ?? new Date()
  const trialEnd = computeExtensionTrialEnd(now, input.amount, input.unit)
  const trialEndUnix = Math.floor(trialEnd.getTime() / 1000)

  const { user, beforeBillingState, testerDemoted, stripeCustomerId } =
    await prepareCustomerAccessGrant(store, stripe, input)

  const created = await stripe.createTimedTrialSubscription({
    customerId: stripeCustomerId,
    priceId: input.priceId,
    trialEndUnix,
    metadata: stripeAssignMetadata({
      actorUserId: input.actorUserId,
      action: 'grant_timed_trial',
    }),
  })

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'grant_timed_trial',
    reason: input.reason.trim(),
    outcome: 'success',
    stripeOperationId: created.stripeSubscriptionId,
    beforeBillingState,
    afterBillingState,
  })

  return {
    stripeCustomerId,
    stripeSubscriptionId: created.stripeSubscriptionId,
    trialEnd: new Date(created.trialEndUnix * 1000),
    testerDemoted,
    auditId: audit.id,
  }
}

export function buildPermanentFreeSubscriptionStripeParams(input: {
  customerId: string
  priceId: string
  actorUserId: string
}) {
  return buildPermanentFreeSubscriptionCreateParams({
    customerId: input.customerId,
    priceId: input.priceId,
    metadata: stripeAssignMetadata({
      actorUserId: input.actorUserId,
      action: 'assign_permanent_free',
    }),
  })
}

export function buildTimedTrialSubscriptionStripeParams(input: {
  customerId: string
  priceId: string
  trialEndUnix: number
  actorUserId: string
}) {
  return buildFreeTimedTrialSubscriptionCreateParams({
    customerId: input.customerId,
    priceId: input.priceId,
    trialEndUnix: input.trialEndUnix,
    metadata: stripeAssignMetadata({
      actorUserId: input.actorUserId,
      action: 'grant_timed_trial',
    }),
  })
}

export function formatAdminCustomerAccessActionLabel(
  action: AdminCustomerAccessAction,
): string {
  switch (action) {
    case 'assign_permanent_free':
      return 'Assign permanent Free'
    case 'grant_timed_trial':
      return 'Grant timed trial'
  }
}

export function billingSnapshotFromSubscription(input: {
  role: string | null
  stripeCustomerId: string | null
  assignedProVariant?: string | null
  subscription: {
    plan: string
    status: string
    stripeSubscriptionId: string | null
  } | null
}): AdminCustomerBillingSnapshot {
  return {
    role: input.role,
    stripeCustomerId: input.stripeCustomerId,
    primaryPlan: input.subscription?.plan ?? null,
    primaryStatus: input.subscription?.status ?? null,
    stripeSubscriptionId: input.subscription?.stripeSubscriptionId ?? null,
    assignedProVariant: input.assignedProVariant ?? null,
  }
}

export function isAdminCustomerAccessAction(
  value: string,
): value is AdminCustomerAccessAction {
  return (ADMIN_CUSTOMER_ACCESS_ACTIONS as readonly string[]).includes(value)
}
