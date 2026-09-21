import type { DashboardMode } from '@/types/models'
import type { DashboardProgramState } from '@/lib/patient-dashboard-session-launch'

/** Query params the home dashboard's Session Picker sets when handing off. */
export const LAUNCH_QUERY_PARAM = 'launch'
export const QUICK_START_QUERY_PARAM = 'quickstart'

/** How long an armed launch waits for the gate to open before giving up. */
export const AUTO_LAUNCH_TIMEOUT_MS = 30_000

export type LaunchIntent = {
  /** Connect to the remembered headset and start treatment once ready. */
  launch: boolean
  /** Open the Quick Start dialog on arrival. */
  quickStart: boolean
}

export function parseLaunchIntent(params: {
  get: (key: string) => string | null
}): LaunchIntent {
  return {
    launch: params.get(LAUNCH_QUERY_PARAM) === '1',
    quickStart: params.get(QUICK_START_QUERY_PARAM) === '1',
  }
}

export function buildLaunchHref(
  patientId: string,
  intent: LaunchIntent,
): string {
  const params = new URLSearchParams()
  if (intent.launch) params.set(LAUNCH_QUERY_PARAM, '1')
  if (intent.quickStart) params.set(QUICK_START_QUERY_PARAM, '1')
  const query = params.toString()
  return `/patients/${patientId}/patient-dashboard${query ? `?${query}` : ''}`
}

export type AutoLaunchGate = {
  selectedMode: DashboardMode
  inQuickStart: boolean
  exerciseCount: number
  treatmentLaunchReady: boolean
  missingSettings: boolean
  programState: DashboardProgramState
}

export type AutoLaunchStep = 'launch' | 'wait' | 'abort'

/**
 * `launch` the first moment every manual-Start precondition holds; `abort`
 * when the clinician has already started something themselves; otherwise
 * keep waiting (headset connecting, Quick Start dialog still open, …).
 */
export function resolveAutoLaunchStep(gate: AutoLaunchGate): AutoLaunchStep {
  if (gate.programState !== 'ready') return 'abort'
  if (gate.selectedMode !== 'main') return 'wait'
  if (gate.inQuickStart) return 'wait'
  if (gate.exerciseCount === 0) return 'wait'
  if (gate.missingSettings) return 'wait'
  if (!gate.treatmentLaunchReady) return 'wait'
  return 'launch'
}

/** The waiting clock only runs while the clinician is not busy in Quick Start. */
export function autoLaunchClockRunning(
  gate: Pick<AutoLaunchGate, 'inQuickStart'>,
): boolean {
  return !gate.inQuickStart
}

export const AUTO_LAUNCH_GAVE_UP = {
  noExercises: 'Auto-launch cancelled: no program selected.',
  missingSettings:
    'Auto-launch cancelled: select an avatar and map in Scene Settings.',
  notReady: 'Auto-launch cancelled: the headset did not become ready in time.',
} as const

/** Why an armed launch gave up; `launchError` is the manual-Start message, if any. */
export function resolveAutoLaunchGaveUpMessage(
  gate: AutoLaunchGate,
  launchError: string | null,
): string {
  if (gate.exerciseCount === 0) return AUTO_LAUNCH_GAVE_UP.noExercises
  if (gate.missingSettings) return AUTO_LAUNCH_GAVE_UP.missingSettings
  return launchError ?? AUTO_LAUNCH_GAVE_UP.notReady
}
