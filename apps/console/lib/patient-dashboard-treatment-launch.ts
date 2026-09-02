export type TreatmentLaunchReadiness = {
  consoleConnected: boolean
  headsetPresent: boolean
  /** Entitlement Clock / admin-tester VR soft gate. */
  entitlementAllowsLaunch: boolean
}

export const TREATMENT_LAUNCH_ERROR = {
  consoleDisconnected: 'Please connect with a device!',
  headsetAbsent: 'Waiting for the VR headset to connect.',
  entitlementExpired:
    'Remaining Time expired. Subscribe to continue launching the VR program.',
} as const

export function canLaunchTreatment({
  consoleConnected,
  headsetPresent,
  entitlementAllowsLaunch,
}: TreatmentLaunchReadiness): boolean {
  return consoleConnected && headsetPresent && entitlementAllowsLaunch
}

export function getTreatmentLaunchError({
  consoleConnected,
  headsetPresent,
  entitlementAllowsLaunch,
}: TreatmentLaunchReadiness): string | null {
  if (!entitlementAllowsLaunch) {
    return TREATMENT_LAUNCH_ERROR.entitlementExpired
  }

  if (!consoleConnected) {
    return TREATMENT_LAUNCH_ERROR.consoleDisconnected
  }

  if (!headsetPresent) {
    return TREATMENT_LAUNCH_ERROR.headsetAbsent
  }

  return null
}
