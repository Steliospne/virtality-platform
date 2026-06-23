import type { DeviceStatusResponse } from '@virtality/shared/types'

export function resolveHeadsetPresentFromDeviceStatus(
  status: DeviceStatusResponse['status'],
): boolean {
  return status === 'active'
}
