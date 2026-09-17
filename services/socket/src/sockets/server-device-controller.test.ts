import { describe, expect, it } from 'vitest'
import { ROOM_PEER_ROLE } from '@virtality/shared/types'
import { createRoleSlotRoomRegistry } from '../domain/role-slot-room-registry'
import { createServerDeviceController } from './server-device-controller'

describe('server-device-controller stale room cleanup', () => {
  it('delegates scheduled cleanup to the Room Registry eviction seam', () => {
    const now = 1_700_000_000_000
    const registry = createRoleSlotRoomRegistry({
      roomTtlMs: 60_000,
      seedRooms: [
        {
          roomCode: 'adapter-ttl-room',
          createdAt: now,
          roleSlots: {
            [ROOM_PEER_ROLE.Console]: { activePeerSocketId: 'console-1' },
            [ROOM_PEER_ROLE.Vr]: { activePeerSocketId: null },
          },
        },
      ],
    })
    const controller = createServerDeviceController({ registry })

    const outcomes = controller.runStaleRoomCleanup(now + 61_000)

    expect(outcomes).toEqual([
      {
        kind: 'room_evicted',
        roomCode: 'adapter-ttl-room',
        reason: 'ttl_expired',
        ageMs: 61_000,
        consoleActivePeerSocketId: 'console-1',
        vrActivePeerSocketId: null,
      },
    ])
    expect(registry.hasRoom('adapter-ttl-room')).toBe(false)
  })
})
