import {
  ENTITLEMENT_EXTENSION_DURATION_UNITS,
  type EntitlementExtensionDurationUnit,
} from '@virtality/shared/utils'
import type { ExtendableSeatSubscriptionStatus } from '@virtality/shared/types'

export const EXTENSION_PAGE_DESCRIPTION =
  'Lengthen a clinician Entitlement Clock. Staff choose the seat and duration only; Stripe verbs and Prices stay server-owned. Live seats add the duration onto the current clock end; expired, canceled, or never-entitled seats get a new no-card Trial Subscription.'

export const EXTENSION_DURATION_UNIT_LABELS: Record<
  EntitlementExtensionDurationUnit,
  string
> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
}

export const EXTENSION_DURATION_UNITS = ENTITLEMENT_EXTENSION_DURATION_UNITS

export const EXTENSION_SEAT_STATUS_LABELS: Record<
  ExtendableSeatSubscriptionStatus,
  string
> = {
  trialing: 'trialing',
  active: 'active',
  canceled: 'canceled',
  expired: 'expired',
  never_entitled: 'never entitled',
}

export function extensionSeatSelectPlaceholder(
  seatsPending: boolean,
  seatCount: number,
): string {
  if (seatsPending) return 'Loading seats...'
  if (seatCount > 0) return 'Select a seat'
  return 'No seats with a Stripe Customer'
}

export function formatExtensionClockEnd(clockEnd: Date | null): string {
  if (!clockEnd) return 'No clock end synced yet'
  return clockEnd.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatExtensionSeatHint(seat: {
  extensionMode: 'update' | 'create'
  clockEnd: Date | null
}): string {
  if (seat.extensionMode === 'create') {
    return 'will create a new Trial Subscription'
  }
  return `current clock ends ${formatExtensionClockEnd(seat.clockEnd)}`
}

export function formatExtensionSuccessMessage(input: {
  mode: 'updated' | 'created'
  previousStatus: string
  trialEnd: Date
}): string {
  const end = formatExtensionClockEnd(input.trialEnd)
  if (input.mode === 'created') {
    return `Created a new Trial Subscription through ${end}. Remaining Time and VR launch restore after Stripe webhook sync.`
  }
  return `Extended ${input.previousStatus} seat through ${end}. Remaining Time updates after Stripe webhook sync.`
}
