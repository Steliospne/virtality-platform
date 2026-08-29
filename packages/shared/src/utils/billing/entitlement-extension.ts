export const ENTITLEMENT_EXTENSION_DURATION_UNITS = [
  'days',
  'weeks',
  'months',
] as const

export type EntitlementExtensionDurationUnit =
  (typeof ENTITLEMENT_EXTENSION_DURATION_UNITS)[number]

export const LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
] as const

export type LiveEntitlementSubscriptionStatus =
  (typeof LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES)[number]

export type LiveSubscriptionRecord = {
  id: string
  referenceId: string
  status: string
  stripeSubscriptionId: string | null
  trialEnd: Date | null
  periodEnd: Date | null
}

export type EntitlementExtensionStore = {
  /**
   * Returns the Customer's live entitled Subscription (`trialing`|`active`)
   * when one exists.
   */
  findLiveSubscriptionByUserId: (
    userId: string,
  ) => Promise<LiveSubscriptionRecord | null>
  /** Stripe Customer id for the user, when Billing Path / Customer exists. */
  findStripeCustomerIdByUserId: (userId: string) => Promise<string | null>
}

export type EntitlementExtensionStripeMetadata = {
  extensionActorUserId: string
  extensionDurationAmount: string
  extensionDurationUnit: EntitlementExtensionDurationUnit
}

export type EntitlementExtensionStripeGateway = {
  /**
   * Stripe `subscriptions.update` with `trial_end` and `proration_behavior: none`.
   * Active seats re-enter trialing; local Subscription sync stays webhook-only.
   */
  updateTrialEnd: (input: {
    stripeSubscriptionId: string
    trialEndUnix: number
    metadata: EntitlementExtensionStripeMetadata
  }) => Promise<{ trialEndUnix: number }>
  /** True when the Customer already has a trialing or active Subscription. */
  customerHasEntitledSubscription: (customerId: string) => Promise<boolean>
  /**
   * Same create shape as Trial Redeem (canonical Price, no card,
   * `missing_payment_method=cancel`), with Extension metadata and absolute
   * `trial_end`. Never resurrects a canceled `sub_` id.
   */
  createNoCardTrialSubscription: (input: {
    customerId: string
    priceId: string
    trialEndUnix: number
    metadata: EntitlementExtensionStripeMetadata
  }) => Promise<{ stripeSubscriptionId: string }>
}

export type ExtendLiveEntitlementClockInput = {
  userId: string
  amount: number
  unit: EntitlementExtensionDurationUnit
  actorUserId: string
}

export type ExtendEntitlementClockInput = ExtendLiveEntitlementClockInput & {
  /** Canonical pro Price; staff never pick Prices. */
  priceId: string
}

export type ExtendEntitlementClockResult = {
  mode: 'updated' | 'created'
  stripeSubscriptionId: string
  previousStatus: LiveEntitlementSubscriptionStatus | 'none'
  trialEnd: Date
}

/** @deprecated Prefer ExtendEntitlementClockResult; kept for live-only callers. */
export type ExtendLiveEntitlementClockResult = ExtendEntitlementClockResult

export class EntitlementExtensionValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntitlementExtensionValidationError'
  }
}

export class EntitlementExtensionNotLiveError extends Error {
  constructor(userId: string) {
    super(
      `No live trialing or active Entitlement Clock found for user "${userId}".`,
    )
    this.name = 'EntitlementExtensionNotLiveError'
  }
}

export class EntitlementExtensionMissingCustomerError extends Error {
  constructor(userId: string) {
    super(
      `No Stripe Customer found for user "${userId}". Extension cannot create a Trial Subscription.`,
    )
    this.name = 'EntitlementExtensionMissingCustomerError'
  }
}

export class EntitlementExtensionAlreadyEntitledError extends Error {
  constructor(userId: string) {
    super(
      `Customer for user "${userId}" already has a trialing or active Subscription. Extension will not create a second live Subscription.`,
    )
    this.name = 'EntitlementExtensionAlreadyEntitledError'
  }
}

export function isEntitlementExtensionDurationUnit(
  value: string,
): value is EntitlementExtensionDurationUnit {
  return (ENTITLEMENT_EXTENSION_DURATION_UNITS as readonly string[]).includes(
    value,
  )
}

export function isLiveEntitlementSubscriptionStatus(
  status: string,
): status is LiveEntitlementSubscriptionStatus {
  return (LIVE_ENTITLEMENT_SUBSCRIPTION_STATUSES as readonly string[]).includes(
    status,
  )
}

/**
 * Staff duration → absolute trial end, measured from `from`.
 * Live updates pass the current clock end (or now if that end is missing /
 * already past). Create paths pass now.
 */
export function computeExtensionTrialEnd(
  from: Date,
  amount: number,
  unit: EntitlementExtensionDurationUnit,
): Date {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new EntitlementExtensionValidationError(
      'Extension amount must be a positive integer.',
    )
  }
  if (!isEntitlementExtensionDurationUnit(unit)) {
    throw new EntitlementExtensionValidationError(
      'Extension unit must be days, weeks, or months.',
    )
  }

  const end = new Date(from.getTime())
  switch (unit) {
    case 'days':
      end.setUTCDate(end.getUTCDate() + amount)
      break
    case 'weeks':
      end.setUTCDate(end.getUTCDate() + amount * 7)
      break
    case 'months':
      end.setUTCMonth(end.getUTCMonth() + amount)
      break
  }
  return end
}

/**
 * Base instant for a live Extension update: current Entitlement Clock end when
 * it is still in the future; otherwise now (never shorten by measuring from a
 * past end, and never overwrite Remaining Time by measuring from now alone).
 */
export function extensionBaseFromLiveClock(
  now: Date,
  subscription: {
    status: LiveEntitlementSubscriptionStatus
    trialEnd: Date | null
    periodEnd: Date | null
  },
): Date {
  const clockEnd =
    subscription.status === 'trialing'
      ? subscription.trialEnd
      : subscription.periodEnd
  if (clockEnd != null && clockEnd.getTime() > now.getTime()) {
    return clockEnd
  }
  return now
}

function extensionMetadata(
  input: Pick<
    ExtendLiveEntitlementClockInput,
    'actorUserId' | 'amount' | 'unit'
  >,
): EntitlementExtensionStripeMetadata {
  return {
    extensionActorUserId: input.actorUserId,
    extensionDurationAmount: String(input.amount),
    extensionDurationUnit: input.unit,
  }
}

function assertExtensionActors(input: ExtendLiveEntitlementClockInput): void {
  if (!input.userId.trim()) {
    throw new EntitlementExtensionValidationError('userId is required.')
  }
  if (!input.actorUserId.trim()) {
    throw new EntitlementExtensionValidationError('actorUserId is required.')
  }
}

type UsableLiveSubscription = LiveSubscriptionRecord & {
  status: LiveEntitlementSubscriptionStatus
  stripeSubscriptionId: string
}

function isUsableLiveSubscription(
  subscription: LiveSubscriptionRecord | null,
): subscription is UsableLiveSubscription {
  return (
    subscription !== null &&
    isLiveEntitlementSubscriptionStatus(subscription.status) &&
    Boolean(subscription.stripeSubscriptionId)
  )
}

async function updateLiveSubscriptionTrialEnd(
  subscription: UsableLiveSubscription,
  stripe: EntitlementExtensionStripeGateway,
  input: ExtendLiveEntitlementClockInput,
  runtime: { now?: () => Date },
): Promise<ExtendEntitlementClockResult> {
  const now = runtime.now?.() ?? new Date()
  const trialEnd = computeExtensionTrialEnd(
    extensionBaseFromLiveClock(now, subscription),
    input.amount,
    input.unit,
  )
  const trialEndUnix = Math.floor(trialEnd.getTime() / 1000)
  await stripe.updateTrialEnd({
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    trialEndUnix,
    metadata: extensionMetadata(input),
  })
  return {
    mode: 'updated',
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    previousStatus: subscription.status,
    trialEnd,
  }
}

/**
 * Extends a live `trialing`|`active` seat via Stripe `trial_end` update.
 * Does not write a local Subscription row (webhook-only sync).
 */
export async function extendLiveEntitlementClock(
  store: EntitlementExtensionStore,
  stripe: EntitlementExtensionStripeGateway,
  input: ExtendLiveEntitlementClockInput,
  runtime: { now?: () => Date } = {},
): Promise<ExtendEntitlementClockResult> {
  assertExtensionActors(input)

  const subscription = await store.findLiveSubscriptionByUserId(input.userId)
  if (!isUsableLiveSubscription(subscription)) {
    throw new EntitlementExtensionNotLiveError(input.userId)
  }

  return updateLiveSubscriptionTrialEnd(subscription, stripe, input, runtime)
}

/**
 * Creates a new no-card Trial Subscription for expired/canceled/never-entitled
 * seats. Does not resurrect canceled Stripe subscription ids. Duplicate
 * entitled Customers are blocked before create. Local sync stays webhook-only.
 */
export async function createTrialSubscriptionForExtension(
  store: EntitlementExtensionStore,
  stripe: EntitlementExtensionStripeGateway,
  input: ExtendEntitlementClockInput,
  runtime: { now?: () => Date } = {},
): Promise<ExtendEntitlementClockResult> {
  assertExtensionActors(input)
  if (!input.priceId.trim()) {
    throw new EntitlementExtensionValidationError('priceId is required.')
  }

  const trialEnd = computeExtensionTrialEnd(
    runtime.now?.() ?? new Date(),
    input.amount,
    input.unit,
  )

  const stripeCustomerId = await store.findStripeCustomerIdByUserId(
    input.userId,
  )
  if (!stripeCustomerId) {
    throw new EntitlementExtensionMissingCustomerError(input.userId)
  }

  const alreadyEntitled =
    await stripe.customerHasEntitledSubscription(stripeCustomerId)
  if (alreadyEntitled) {
    throw new EntitlementExtensionAlreadyEntitledError(input.userId)
  }

  const trialEndUnix = Math.floor(trialEnd.getTime() / 1000)
  const created = await stripe.createNoCardTrialSubscription({
    customerId: stripeCustomerId,
    priceId: input.priceId,
    trialEndUnix,
    metadata: extensionMetadata(input),
  })

  return {
    mode: 'created',
    stripeSubscriptionId: created.stripeSubscriptionId,
    previousStatus: 'none',
    trialEnd,
  }
}

/**
 * Adminboard Extension entry: update live `trialing`|`active`, else create a
 * new no-card Trial Subscription for non-live seats.
 */
export async function extendEntitlementClock(
  store: EntitlementExtensionStore,
  stripe: EntitlementExtensionStripeGateway,
  input: ExtendEntitlementClockInput,
  runtime: { now?: () => Date } = {},
): Promise<ExtendEntitlementClockResult> {
  assertExtensionActors(input)

  const subscription = await store.findLiveSubscriptionByUserId(input.userId)
  if (isUsableLiveSubscription(subscription)) {
    return updateLiveSubscriptionTrialEnd(subscription, stripe, input, runtime)
  }

  return createTrialSubscriptionForExtension(store, stripe, input, runtime)
}
