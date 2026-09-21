import type { DeviceVrPresenceStatus } from '@/lib/vr-presence-status'

export const QUICK_START_PROGRAM_ID = 'quick-start'

export type HomePickerSelection = {
  patientId: string | null
  /** A Reusable Program id, or `QUICK_START_PROGRAM_ID`. */
  programId: string | null
  deviceId: string | null
}

export const emptyHomePickerSelection: HomePickerSelection = {
  patientId: null,
  programId: null,
  deviceId: null,
}

export type HomePickerStepKey = keyof HomePickerSelection

const missingLabels: Record<HomePickerStepKey, string> = {
  patientId: 'choose a patient',
  programId: 'choose a program',
  deviceId: 'choose a headset to continue',
}

export type HomePickerSummary = {
  /** Names of what is already chosen, in step order. */
  chosen: string[]
  /** Prompt for the first step still open, or null when ready to launch. */
  missing: string | null
}

export function summarizeHomePicker(
  selection: HomePickerSelection,
  names: Partial<Record<HomePickerStepKey, string | null | undefined>>,
): HomePickerSummary {
  const chosen: string[] = []
  let missing: string | null = null

  for (const key of ['patientId', 'programId', 'deviceId'] as const) {
    const name = selection[key] ? names[key] : null
    if (name) chosen.push(name)
    else if (!missing) missing = missingLabels[key]
  }

  return { chosen, missing }
}

export function isHomePickerReady(selection: HomePickerSelection): boolean {
  return Boolean(
    selection.patientId && selection.programId && selection.deviceId,
  )
}

/** A headset can be chosen only when paired and not known to be offline. */
export function isHeadsetSelectable(status: DeviceVrPresenceStatus): boolean {
  return status === 'online' || status === 'loading'
}

/** Where Launch sends the clinician: the patient dashboard, opening Quick Start when picked. */
export function homeLaunchHref(selection: HomePickerSelection): string | null {
  if (!isHomePickerReady(selection) || !selection.patientId) return null
  const base = `/patients/${selection.patientId}/patient-dashboard`
  return selection.programId === QUICK_START_PROGRAM_ID
    ? `${base}?quickstart=1`
    : base
}

/** Keeps a saved program/headset only while it still exists in the lists. */
export function reconcileHomePickerSelection(
  selection: HomePickerSelection,
  available: { programIds: string[]; deviceIds: string[] },
): HomePickerSelection {
  const programId =
    selection.programId === QUICK_START_PROGRAM_ID ||
    (selection.programId && available.programIds.includes(selection.programId))
      ? selection.programId
      : null
  const deviceId =
    selection.deviceId && available.deviceIds.includes(selection.deviceId)
      ? selection.deviceId
      : null
  return { ...selection, programId, deviceId }
}

export function isSameHomePickerSelection(
  a: HomePickerSelection,
  b: HomePickerSelection,
): boolean {
  return (
    a.patientId === b.patientId &&
    a.programId === b.programId &&
    a.deviceId === b.deviceId
  )
}
