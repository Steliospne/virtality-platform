import {
  ENTITLEMENT_EXTENSION_DIRECTIONS,
  ENTITLEMENT_EXTENSION_DURATION_UNITS,
  type EntitlementExtensionDirection,
  type EntitlementExtensionDurationUnit,
} from '@virtality/shared/utils'

export const EXTENSION_DURATION_UNIT_LABELS: Record<
  EntitlementExtensionDurationUnit,
  string
> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
}

export const EXTENSION_DURATION_UNITS = ENTITLEMENT_EXTENSION_DURATION_UNITS

export const EXTENSION_DIRECTION_LABELS: Record<
  EntitlementExtensionDirection,
  string
> = {
  extend: 'Extend (add time)',
  reduce: 'Reduce (remove time)',
}

export const EXTENSION_DIRECTIONS = ENTITLEMENT_EXTENSION_DIRECTIONS

export function formatExtensionClockEnd(clockEnd: Date | null): string {
  if (!clockEnd) return 'No clock end synced yet'
  return clockEnd.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
