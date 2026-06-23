export type TreatmentLaunchReadiness = {
  consoleConnected: boolean
  headsetPresent: boolean
}

export function canLaunchTreatment({
  consoleConnected,
  headsetPresent,
}: TreatmentLaunchReadiness): boolean {
  return consoleConnected && headsetPresent
}

export function resolveHeadsetPresentFromDeviceStatus(
  status: 'active' | 'inactive',
): boolean {
  return status === 'active'
}
