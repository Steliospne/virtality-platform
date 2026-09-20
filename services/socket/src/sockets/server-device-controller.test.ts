import { describe, expect, it, vi } from 'vitest'
import { ROOM_PEER_ROLE } from '@virtality/shared/types'

const debugLog = vi.hoisted(() => vi.fn())

vi.mock('@virtality/shared/observability', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@virtality/shared/observability')>()
  return {
    ...actual,
    createAppLogger: () => ({
      debug: debugLog,
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    }),
  }
})
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

describe('server-device-controller room snapshot', () => {
  it('logs a snapshot only when the room set changes', () => {
    debugLog.mockClear()
    const registry = createRoleSlotRoomRegistry({
      seedRooms: [
        {
          roomCode: 'snapshot-room',
          createdAt: 1_700_000_000_000,
          roleSlots: {
            [ROOM_PEER_ROLE.Console]: { activePeerSocketId: 'console-1' },
            [ROOM_PEER_ROLE.Vr]: { activePeerSocketId: null },
          },
        },
      ],
    })
    const controller = createServerDeviceController({ registry })

    controller.logRoomSnapshot()
    controller.logRoomSnapshot()
    expect(debugLog).toHaveBeenCalledTimes(1)
    expect(debugLog).toHaveBeenLastCalledWith(
      'socket.rooms.snapshot',
      expect.objectContaining({ activeRoomCount: 1 }),
    )

    registry.reset()
    controller.logRoomSnapshot()
    controller.logRoomSnapshot()
    expect(debugLog).toHaveBeenCalledTimes(2)
    expect(debugLog).toHaveBeenLastCalledWith(
      'socket.rooms.snapshot',
      expect.objectContaining({ activeRoomCount: 0, rooms: [] }),
    )
  })
})
