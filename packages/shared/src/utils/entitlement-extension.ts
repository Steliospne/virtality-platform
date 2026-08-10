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
   * when one exists. Does not invent create-path seats (see Extension #54).
   */
  findLiveSubscriptionByUserId: (
    userId: string,
  ) => Promise<LiveSubscriptionRecord | null>
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
}

export type ExtendLiveEntitlementClockInput = {
  userId: string
  amount: number
  unit: EntitlementExtensionDurationUnit
  actorUserId: string
}

export type ExtendLiveEntitlementClockResult = {
  stripeSubscriptionId: string
  previousStatus: LiveEntitlementSubscriptionStatus
  trialEnd: Date
}

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
 * Staff duration → absolute trial end. Always measured from `now` (not from
 * the previous clock end), matching Stripe `trial_end = now+N`.
 */
export function computeExtensionTrialEnd(
  now: Date,
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

  const end = new Date(now.getTime())
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
 * Extends a live `trialing`|`active` seat via Stripe `trial_end` update.
 * Does not write a local Subscription row (webhook-only sync).
 * Non-live seats are out of scope here (create path is Extension #54).
 */
export async function extendLiveEntitlementClock(
  store: EntitlementExtensionStore,
  stripe: EntitlementExtensionStripeGateway,
  input: ExtendLiveEntitlementClockInput,
  runtime: { now?: () => Date } = {},
): Promise<ExtendLiveEntitlementClockResult> {
  if (!input.userId.trim()) {
    throw new EntitlementExtensionValidationError('userId is required.')
  }
  if (!input.actorUserId.trim()) {
    throw new EntitlementExtensionValidationError('actorUserId is required.')
  }

  const trialEnd = computeExtensionTrialEnd(
    runtime.now?.() ?? new Date(),
    input.amount,
    input.unit,
  )

  const subscription = await store.findLiveSubscriptionByUserId(input.userId)
  if (
    !subscription ||
    !isLiveEntitlementSubscriptionStatus(subscription.status) ||
    !subscription.stripeSubscriptionId
  ) {
    throw new EntitlementExtensionNotLiveError(input.userId)
  }

  const trialEndUnix = Math.floor(trialEnd.getTime() / 1000)
  await stripe.updateTrialEnd({
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    trialEndUnix,
    metadata: {
      extensionActorUserId: input.actorUserId,
      extensionDurationAmount: String(input.amount),
      extensionDurationUnit: input.unit,
    },
  })

  return {
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    previousStatus: subscription.status,
    trialEnd,
  }
}
