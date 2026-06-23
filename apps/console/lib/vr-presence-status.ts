export type DeviceVrPresenceStatus =
  | 'unpaired'
  | 'loading'
  | 'online'
  | 'offline'

type DeviceWithRoomCode = {
  deviceId: string | null
}

export function getPairedDeviceRoomCodes(
  devices: DeviceWithRoomCode[],
): string[] {
  return devices
    .map((device) => device.deviceId)
    .filter((deviceId): deviceId is string => Boolean(deviceId))
}

export function resolveDeviceVrPresenceStatus(
  deviceRoomCode: string | null | undefined,
  presenceByRoomCode: Record<string, boolean>,
  hasPolled: boolean,
): DeviceVrPresenceStatus {
  if (!deviceRoomCode) {
    return 'unpaired'
  }

  if (!hasPolled) {
    return 'loading'
  }

  return presenceByRoomCode[deviceRoomCode] ? 'online' : 'offline'
}

export function buildDevicePresenceById(
  devices: Array<{ id: string; deviceId: string | null }>,
  presenceByRoomCode: Record<string, boolean>,
  hasPolled: boolean,
): Record<string, DeviceVrPresenceStatus> {
  return Object.fromEntries(
    devices.map((device) => [
      device.id,
      resolveDeviceVrPresenceStatus(
        device.deviceId,
        presenceByRoomCode,
        hasPolled,
      ),
    ]),
  )
}
