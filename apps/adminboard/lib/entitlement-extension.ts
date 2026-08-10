import {
  ENTITLEMENT_EXTENSION_DURATION_UNITS,
  type EntitlementExtensionDurationUnit,
} from '@virtality/shared/utils'

export const EXTENSION_PAGE_DESCRIPTION =
  'Lengthen a clinician Entitlement Clock for a live trialing or active seat. Staff choose the seat and duration only; Stripe verbs and Prices stay server-owned.'

export const EXTENSION_DURATION_UNIT_LABELS: Record<
  EntitlementExtensionDurationUnit,
  string
> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
}

export const EXTENSION_DURATION_UNITS = ENTITLEMENT_EXTENSION_DURATION_UNITS

export function extensionSeatSelectPlaceholder(
  seatsPending: boolean,
  seatCount: number,
): string {
  if (seatsPending) return 'Loading live seats...'
  if (seatCount > 0) return 'Select a trialing or active seat'
  return 'No live trialing or active seats'
}

export function formatExtensionClockEnd(clockEnd: Date | null): string {
  if (!clockEnd) return 'No clock end synced yet'
  return clockEnd.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
