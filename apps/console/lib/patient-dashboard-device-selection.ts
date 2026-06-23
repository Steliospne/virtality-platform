import type { VRDevice } from '@/types/models'

export type DashboardDevice = Pick<VRDevice['data'], 'id' | 'deviceId'>

export type SavedHeadsetSelectionResult<T> = {
  selectedDevice: T | null
  shouldClearSavedHeadset: boolean
}

const emptySavedHeadsetSelection = {
  selectedDevice: null,
  shouldClearSavedHeadset: false,
} as const satisfies SavedHeadsetSelectionResult<never>

export function isDashboardDeviceSelectable(device: {
  deviceId: string | null
}): boolean {
  return Boolean(device.deviceId)
}

export function resolveSavedHeadsetSelection<
  T extends { data: DashboardDevice },
>(
  devices: T[] | undefined,
  lastHeadsetId: string | undefined,
): SavedHeadsetSelectionResult<T> {
  if (!lastHeadsetId || !devices) {
    return emptySavedHeadsetSelection
  }

  const savedDevice =
    devices.find((device) => device.data.id === lastHeadsetId) ?? null

  if (!savedDevice) {
    return emptySavedHeadsetSelection
  }

  if (!isDashboardDeviceSelectable(savedDevice.data)) {
    return { selectedDevice: null, shouldClearSavedHeadset: true }
  }

  return { selectedDevice: savedDevice, shouldClearSavedHeadset: false }
}
