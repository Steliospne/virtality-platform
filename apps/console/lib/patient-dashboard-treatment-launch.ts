export type TreatmentLaunchReadiness = {
  consoleConnected: boolean
  headsetPresent: boolean
  /** Entitlement Clock / admin-tester VR soft gate. */
  entitlementAllowsLaunch: boolean
  /** Standing query still loading; launch is held until it resolves. */
  entitlementPending?: boolean
}

export const TREATMENT_LAUNCH_ERROR = {
  consoleDisconnected: 'Please connect with a device!',
  headsetAbsent: 'Waiting for the VR headset to connect.',
  entitlementExpired:
    'Remaining Time expired. Subscribe to continue launching the VR program.',
  entitlementPending: 'Checking Remaining Time…',
} as const

export function canLaunchTreatment({
  consoleConnected,
  headsetPresent,
  entitlementAllowsLaunch,
  entitlementPending = false,
}: TreatmentLaunchReadiness): boolean {
  return (
    consoleConnected &&
    headsetPresent &&
    !entitlementPending &&
    entitlementAllowsLaunch
  )
}

export function getTreatmentLaunchError({
  consoleConnected,
  headsetPresent,
  entitlementAllowsLaunch,
  entitlementPending = false,
}: TreatmentLaunchReadiness): string | null {
  if (entitlementPending) {
    return TREATMENT_LAUNCH_ERROR.entitlementPending
  }

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
