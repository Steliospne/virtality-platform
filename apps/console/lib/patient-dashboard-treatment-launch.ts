export type TreatmentLaunchReadiness = {
  consoleConnected: boolean
  headsetPresent: boolean
}

export const TREATMENT_LAUNCH_ERROR = {
  consoleDisconnected: 'Please connect with a device!',
  headsetAbsent: 'Waiting for the VR headset to connect.',
} as const

export function canLaunchTreatment({
  consoleConnected,
  headsetPresent,
}: TreatmentLaunchReadiness): boolean {
  return consoleConnected && headsetPresent
}

export function getTreatmentLaunchError({
  consoleConnected,
  headsetPresent,
}: TreatmentLaunchReadiness): string | null {
  if (!consoleConnected) {
    return TREATMENT_LAUNCH_ERROR.consoleDisconnected
  }

  if (!headsetPresent) {
    return TREATMENT_LAUNCH_ERROR.headsetAbsent
  }

  return null
}
