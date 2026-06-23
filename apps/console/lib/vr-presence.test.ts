import { describe, expect, it } from 'vitest'
import {
  buildDevicePresenceById,
  getPairedDeviceRoomCodes,
  resolveDeviceVrPresenceStatus,
} from './vr-presence-status'

describe('vr presence helpers', () => {
  it('collects paired device room codes only', () => {
    expect(
      getPairedDeviceRoomCodes([
        { deviceId: 'room-a' },
        { deviceId: null },
        { deviceId: 'room-b' },
      ]),
    ).toEqual(['room-a', 'room-b'])
  })

  it('marks unpaired devices without waiting for a poll response', () => {
    expect(resolveDeviceVrPresenceStatus(null, {}, false)).toBe('unpaired')
    expect(resolveDeviceVrPresenceStatus(undefined, {}, true)).toBe('unpaired')
  })

  it('shows loading before the first poll response for paired devices', () => {
    expect(resolveDeviceVrPresenceStatus('room-a', {}, false)).toBe('loading')
  })

  it('maps polled presence to online and offline states', () => {
    expect(
      resolveDeviceVrPresenceStatus('room-a', { 'room-a': true }, true),
    ).toBe('online')
    expect(
      resolveDeviceVrPresenceStatus('room-a', { 'room-a': false }, true),
    ).toBe('offline')
  })

  it('builds per-device presence rows for the dropdown', () => {
    expect(
      buildDevicePresenceById(
        [
          { id: 'device-1', deviceId: 'room-a' },
          { id: 'device-2', deviceId: null },
          { id: 'device-3', deviceId: 'room-b' },
        ],
        { 'room-a': true, 'room-b': false },
        true,
      ),
    ).toEqual({
      'device-1': 'online',
      'device-2': 'unpaired',
      'device-3': 'offline',
    })
  })
})
