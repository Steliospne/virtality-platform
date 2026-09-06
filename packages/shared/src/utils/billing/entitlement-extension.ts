export const ENTITLEMENT_EXTENSION_DURATION_UNITS = [
  'days',
  'weeks',
  'months',
] as const

export type EntitlementExtensionDurationUnit =
  (typeof ENTITLEMENT_EXTENSION_DURATION_UNITS)[number]

export const ENTITLEMENT_EXTENSION_DIRECTIONS = ['extend', 'reduce'] as const

export type EntitlementExtensionDirection =
  (typeof ENTITLEMENT_EXTENSION_DIRECTIONS)[number]

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

export class EntitlementExtensionValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntitlementExtensionValidationError'
  }
}

export function isEntitlementExtensionDurationUnit(
  value: string,
): value is EntitlementExtensionDurationUnit {
  return (ENTITLEMENT_EXTENSION_DURATION_UNITS as readonly string[]).includes(
    value,
  )
}

export function isEntitlementExtensionDirection(
  value: string,
): value is EntitlementExtensionDirection {
  return (ENTITLEMENT_EXTENSION_DIRECTIONS as readonly string[]).includes(value)
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
 * already past). Create paths pass now. `direction` flips the offset so
 * staff can shorten (`reduce`) as well as lengthen (`extend`, the default)
 * the clock.
 */
export function computeExtensionTrialEnd(
  from: Date,
  amount: number,
  unit: EntitlementExtensionDurationUnit,
  direction: EntitlementExtensionDirection = 'extend',
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
  if (!isEntitlementExtensionDirection(direction)) {
    throw new EntitlementExtensionValidationError(
      'Extension direction must be extend or reduce.',
    )
  }

  const signedAmount = direction === 'reduce' ? -amount : amount
  const end = new Date(from.getTime())
  switch (unit) {
    case 'days':
      end.setUTCDate(end.getUTCDate() + signedAmount)
      break
    case 'weeks':
      end.setUTCDate(end.getUTCDate() + signedAmount * 7)
      break
    case 'months':
      end.setUTCMonth(end.getUTCMonth() + signedAmount)
      break
  }
  return end
}
