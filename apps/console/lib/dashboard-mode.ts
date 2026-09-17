import type { DashboardMode } from '@/types/models'

export const DASHBOARD_MODES: readonly DashboardMode[] = [
  'main',
  'free',
  'immersive',
]

/** Narrow a value read from local storage to a known dashboard mode. */
export function parseDashboardMode(value: unknown): DashboardMode | null {
  return DASHBOARD_MODES.includes(value as DashboardMode)
    ? (value as DashboardMode)
    : null
}
