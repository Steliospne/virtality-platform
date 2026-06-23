import { describe, expect, it, beforeEach } from 'vitest'
import { ROOM_PEER_ROLE, type RoomPeerRole } from '@virtality/shared/types'
import {
  createRoleSlotRoomRegistry,
  type RoleSlotRoomRegistry,
} from './role-slot-room-registry'

function joinRoleSlot(
  registry: RoleSlotRoomRegistry,
  roomCode: string,
  peerSocketId: string,
  roomPeerRole: RoomPeerRole,
) {
  return registry.joinRoleSlot({ roomCode, peerSocketId, roomPeerRole })
}

function joinConsole(
  registry: RoleSlotRoomRegistry,
  roomCode: string,
  peerSocketId: string,
) {
  return joinRoleSlot(registry, roomCode, peerSocketId, ROOM_PEER_ROLE.Console)
}

function joinVr(
  registry: RoleSlotRoomRegistry,
  roomCode: string,
  peerSocketId: string,
) {
  return joinRoleSlot(registry, roomCode, peerSocketId, ROOM_PEER_ROLE.Vr)
}

function disconnectRolePeer(
  registry: RoleSlotRoomRegistry,
  roomCode: string,
  peerSocketId: string,
  roomPeerRole: RoomPeerRole,
) {
  return registry.disconnectRolePeer({ roomCode, peerSocketId, roomPeerRole })
}

function disconnectConsole(
  registry: RoleSlotRoomRegistry,
  roomCode: string,
  peerSocketId: string,
) {
  return disconnectRolePeer(
    registry,
    roomCode,
    peerSocketId,
    ROOM_PEER_ROLE.Console,
  )
}

function disconnectVr(
  registry: RoleSlotRoomRegistry,
  roomCode: string,
  peerSocketId: string,
) {
  return disconnectRolePeer(registry, roomCode, peerSocketId, ROOM_PEER_ROLE.Vr)
}

function authorizeRelay(
  registry: RoleSlotRoomRegistry,
  roomCode: string,
  peerSocketId: string,
  roomPeerRole: RoomPeerRole,
) {
  return registry.authorizeRelay({ roomCode, peerSocketId, roomPeerRole })
}

function joinCompleteRoom(
  registry: RoleSlotRoomRegistry,
  roomCode: string,
  consoleSocketId = 'console-1',
  vrSocketId = 'vr-1',
) {
  joinConsole(registry, roomCode, consoleSocketId)
  return joinVr(registry, roomCode, vrSocketId)
}

describe('Role Slot Room Registry', () => {
  let registry: RoleSlotRoomRegistry

  beforeEach(() => {
    registry = createRoleSlotRoomRegistry()
  })

  describe('joinRoleSlot outcomes', () => {
    it('returns role_slot_joined for the first peer in an empty Role Slot', () => {
      const outcome = joinConsole(registry, 'treatment-room', 'console-1')

      expect(outcome).toEqual({
        kind: 'role_slot_joined',
        roomCode: 'treatment-room',
        roomPeerRole: ROOM_PEER_ROLE.Console,
        activePeerSocketId: 'console-1',
        roomComplete: false,
      })
    })

    it('returns role_slot_joined with roomComplete once both Role Slots are occupied', () => {
      joinConsole(registry, 'complete-room', 'console-1')

      const outcome = joinVr(registry, 'complete-room', 'vr-1')

      expect(outcome).toEqual({
        kind: 'role_slot_joined',
        roomCode: 'complete-room',
        roomPeerRole: ROOM_PEER_ROLE.Vr,
        activePeerSocketId: 'vr-1',
        roomComplete: true,
      })
    })

    it('returns role_peer_replaced when joining an occupied console Role Slot', () => {
      joinCompleteRoom(registry, 'replacement-room')

      const outcome = joinConsole(registry, 'replacement-room', 'console-2')

      expect(outcome).toEqual({
        kind: 'role_peer_replaced',
        roomCode: 'replacement-room',
        roomPeerRole: ROOM_PEER_ROLE.Console,
        replacedPeerSocketId: 'console-1',
        activePeerSocketId: 'console-2',
        roomComplete: true,
      })
    })

    it('returns role_peer_replaced when joining an occupied VR Role Slot', () => {
      joinCompleteRoom(registry, 'vr-replacement-room')

      const outcome = joinVr(registry, 'vr-replacement-room', 'vr-2')

      expect(outcome).toEqual({
        kind: 'role_peer_replaced',
        roomCode: 'vr-replacement-room',
        roomPeerRole: ROOM_PEER_ROLE.Vr,
        replacedPeerSocketId: 'vr-1',
        activePeerSocketId: 'vr-2',
        roomComplete: true,
      })
    })

    it('reports roomComplete false when replacing into an incomplete room', () => {
      joinConsole(registry, 'incomplete-replacement-room', 'console-1')

      const outcome = joinConsole(
        registry,
        'incomplete-replacement-room',
        'console-2',
      )

      expect(outcome).toEqual({
        kind: 'role_peer_replaced',
        roomCode: 'incomplete-replacement-room',
        roomPeerRole: ROOM_PEER_ROLE.Console,
        replacedPeerSocketId: 'console-1',
        activePeerSocketId: 'console-2',
        roomComplete: false,
      })
    })
  })

  describe('disconnectRolePeer outcomes', () => {
    it('returns role_slot_cleared when the active peer departs with another slot occupied', () => {
      joinCompleteRoom(registry, 'departure-room')

      const outcome = disconnectConsole(registry, 'departure-room', 'console-1')

      expect(outcome).toEqual({
        kind: 'role_slot_cleared',
        roomCode: 'departure-room',
        roomPeerRole: ROOM_PEER_ROLE.Console,
        departedPeerSocketId: 'console-1',
        roomComplete: false,
      })
      expect(registry.hasRoom('departure-room')).toBe(true)
    })

    it('returns room_deleted when the final active peer departs', () => {
      joinConsole(registry, 'empty-room', 'console-1')

      const outcome = disconnectConsole(registry, 'empty-room', 'console-1')

      expect(outcome).toEqual({
        kind: 'room_deleted',
        roomCode: 'empty-room',
        reason: 'both_role_slots_empty',
      })
      expect(registry.hasRoom('empty-room')).toBe(false)
      expect(registry.getRoomSnapshot('empty-room')).toBeNull()
    })

    it('returns room_deleted after both peers depart sequentially', () => {
      joinCompleteRoom(registry, 'sequential-empty-room')

      const firstDeparture = disconnectConsole(
        registry,
        'sequential-empty-room',
        'console-1',
      )
      expect(firstDeparture.kind).toBe('role_slot_cleared')
      expect(registry.hasRoom('sequential-empty-room')).toBe(true)

      const secondDeparture = disconnectVr(
        registry,
        'sequential-empty-room',
        'vr-1',
      )
      expect(secondDeparture).toEqual({
        kind: 'room_deleted',
        roomCode: 'sequential-empty-room',
        reason: 'both_role_slots_empty',
      })
      expect(registry.hasRoom('sequential-empty-room')).toBe(false)
    })

    it('returns room_not_found when disconnecting from an unknown room', () => {
      const outcome = disconnectConsole(registry, 'missing-room', 'console-1')

      expect(outcome).toEqual({
        kind: 'room_not_found',
        roomCode: 'missing-room',
      })
    })
  })

  describe('stale disconnect policy', () => {
    it('ignores stale disconnects from a replaced console Active Role Peer', () => {
      joinCompleteRoom(registry, 'stale-console-room')
      joinConsole(registry, 'stale-console-room', 'console-2')

      const outcome = disconnectConsole(
        registry,
        'stale-console-room',
        'console-1',
      )

      expect(outcome).toEqual({
        kind: 'stale_disconnect_ignored',
        roomCode: 'stale-console-room',
        roomPeerRole: ROOM_PEER_ROLE.Console,
        peerSocketId: 'console-1',
        activePeerSocketId: 'console-2',
      })
      expect(registry.getDeviceStatus('stale-console-room')).toBe('active')
      expect(registry.getRoomSnapshot('stale-console-room')).toMatchObject({
        roomComplete: true,
        roomEmpty: false,
      })
    })

    it('ignores stale disconnects from a replaced VR Active Role Peer', () => {
      joinCompleteRoom(registry, 'stale-vr-room')
      joinVr(registry, 'stale-vr-room', 'vr-2')

      const outcome = disconnectVr(registry, 'stale-vr-room', 'vr-1')

      expect(outcome).toEqual({
        kind: 'stale_disconnect_ignored',
        roomCode: 'stale-vr-room',
        roomPeerRole: ROOM_PEER_ROLE.Vr,
        peerSocketId: 'vr-1',
        activePeerSocketId: 'vr-2',
      })
      expect(registry.getDeviceStatus('stale-vr-room')).toBe('active')
      expect(registry.getRoomSnapshot('stale-vr-room')).toMatchObject({
        roomComplete: true,
        roomEmpty: false,
      })
    })
  })

  describe('room completeness and lifecycle snapshots', () => {
    it('exposes incomplete room snapshots through getRoomSnapshot', () => {
      joinConsole(registry, 'snapshot-room', 'console-1')

      expect(registry.getRoomSnapshot('snapshot-room')).toMatchObject({
        roomCode: 'snapshot-room',
        roomComplete: false,
        roomEmpty: false,
        roleSlots: {
          [ROOM_PEER_ROLE.Console]: { activePeerSocketId: 'console-1' },
          [ROOM_PEER_ROLE.Vr]: { activePeerSocketId: null },
        },
      })
      expect(registry.getDeviceStatus('snapshot-room')).toBe('inactive')
    })

    it('exposes complete room snapshots through getRoomSnapshot', () => {
      joinCompleteRoom(registry, 'complete-snapshot-room')

      expect(registry.getRoomSnapshot('complete-snapshot-room')).toMatchObject({
        roomCode: 'complete-snapshot-room',
        roomComplete: true,
        roomEmpty: false,
        roleSlots: {
          [ROOM_PEER_ROLE.Console]: { activePeerSocketId: 'console-1' },
          [ROOM_PEER_ROLE.Vr]: { activePeerSocketId: 'vr-1' },
        },
      })
      expect(registry.getDeviceStatus('complete-snapshot-room')).toBe('active')
    })

    it('marks the room incomplete after one active peer departs normally', () => {
      joinCompleteRoom(registry, 'incomplete-after-departure')

      disconnectVr(registry, 'incomplete-after-departure', 'vr-1')

      expect(
        registry.getRoomSnapshot('incomplete-after-departure'),
      ).toMatchObject({
        roomComplete: false,
        roomEmpty: false,
      })
      expect(registry.getDeviceStatus('incomplete-after-departure')).toBe(
        'inactive',
      )
    })

    it('preserves room completeness through console replacement', () => {
      joinCompleteRoom(registry, 'replacement-complete-room')
      joinConsole(registry, 'replacement-complete-room', 'console-2')

      expect(
        registry.getRoomSnapshot('replacement-complete-room'),
      ).toMatchObject({
        roomComplete: true,
        roomEmpty: false,
      })
      expect(registry.getDeviceStatus('replacement-complete-room')).toBe(
        'active',
      )
    })

    it('tracks active room count and snapshots for adapter diagnostics', () => {
      expect(registry.getActiveRoomCount()).toBe(0)
      expect(registry.listRoomSnapshots()).toEqual([])

      joinConsole(registry, 'diagnostic-room', 'console-1')

      expect(registry.getActiveRoomCount()).toBe(1)
      expect(registry.listRoomSnapshots()).toEqual([
        expect.objectContaining({
          roomCode: 'diagnostic-room',
          roomComplete: false,
          roomEmpty: false,
        }),
      ])
    })
  })

  describe('evictStaleRooms outcomes', () => {
    it('evicts TTL-expired rooms even when a Role Slot remains occupied', () => {
      const ttlRegistry = createRoleSlotRoomRegistry({ roomTtlMs: 1_000 })
      joinCompleteRoom(ttlRegistry, 'ttl-room')
      const createdAt = ttlRegistry.getRoomSnapshot('ttl-room')!.createdAt

      const evicted = ttlRegistry.evictStaleRooms(createdAt + 1_001)

      expect(evicted).toEqual([
        {
          kind: 'room_evicted',
          roomCode: 'ttl-room',
          reason: 'ttl_expired',
          ageMs: 1_001,
          consoleActivePeerSocketId: 'console-1',
          vrActivePeerSocketId: 'vr-1',
        },
      ])
      expect(ttlRegistry.hasRoom('ttl-room')).toBe(false)
    })

    it('evicts rooms older than the configured TTL via seeded rooms', () => {
      const now = 1_700_000_000_000
      const ttlRegistry = createRoleSlotRoomRegistry({
        roomTtlMs: 60_000,
        seedRooms: [
          {
            roomCode: 'ttl-room',
            createdAt: now,
            roleSlots: {
              [ROOM_PEER_ROLE.Console]: { activePeerSocketId: 'console-1' },
              [ROOM_PEER_ROLE.Vr]: { activePeerSocketId: null },
            },
          },
        ],
      })

      const outcomes = ttlRegistry.evictStaleRooms(now + 61_000)

      expect(outcomes).toEqual([
        {
          kind: 'room_evicted',
          roomCode: 'ttl-room',
          reason: 'ttl_expired',
          ageMs: 61_000,
          consoleActivePeerSocketId: 'console-1',
          vrActivePeerSocketId: null,
        },
      ])
      expect(ttlRegistry.hasRoom('ttl-room')).toBe(false)
    })

    it('evicts empty rooms even when they are younger than the TTL', () => {
      const ttlRegistry = createRoleSlotRoomRegistry({
        roomTtlMs: 60_000,
        seedRooms: [
          {
            roomCode: 'empty-room',
            createdAt: Date.now(),
            roleSlots: {
              [ROOM_PEER_ROLE.Console]: { activePeerSocketId: null },
              [ROOM_PEER_ROLE.Vr]: { activePeerSocketId: null },
            },
          },
        ],
      })

      const outcomes = ttlRegistry.evictStaleRooms()

      expect(outcomes).toEqual([
        {
          kind: 'room_evicted',
          roomCode: 'empty-room',
          reason: 'both_role_slots_empty',
          ageMs: expect.any(Number),
          consoleActivePeerSocketId: null,
          vrActivePeerSocketId: null,
        },
      ])
      expect(ttlRegistry.hasRoom('empty-room')).toBe(false)
    })

    it('keeps occupied rooms that are still within the TTL', () => {
      const ttlRegistry = createRoleSlotRoomRegistry({ roomTtlMs: 60_000 })

      ttlRegistry.joinRoleSlot({
        roomCode: 'active-room',
        peerSocketId: 'console-1',
        roomPeerRole: ROOM_PEER_ROLE.Console,
      })

      expect(ttlRegistry.evictStaleRooms(Date.now() + 30_000)).toEqual([])
      expect(ttlRegistry.hasRoom('active-room')).toBe(true)
    })
  })

  describe('getVrPresence', () => {
    it('returns false for missing rooms', () => {
      expect(registry.getVrPresence(['missing-room'])).toEqual({
        'missing-room': false,
      })
    })

    it('returns true when the VR Role Slot is occupied', () => {
      joinVr(registry, 'vr-present-room', 'vr-1')

      expect(registry.getVrPresence(['vr-present-room'])).toEqual({
        'vr-present-room': true,
      })
    })

    it('returns false when only the console Role Slot is occupied', () => {
      joinConsole(registry, 'console-only-room', 'console-1')

      expect(registry.getVrPresence(['console-only-room'])).toEqual({
        'console-only-room': false,
      })
    })

    it('returns false after the VR peer disconnects normally', () => {
      joinCompleteRoom(registry, 'vr-departed-room')
      disconnectVr(registry, 'vr-departed-room', 'vr-1')

      expect(registry.getVrPresence(['vr-departed-room'])).toEqual({
        'vr-departed-room': false,
      })
    })

    it('reflects the active VR peer after replacement', () => {
      joinCompleteRoom(registry, 'vr-replacement-room')
      joinVr(registry, 'vr-replacement-room', 'vr-2')

      expect(registry.getVrPresence(['vr-replacement-room'])).toEqual({
        'vr-replacement-room': true,
      })
    })

    it('reports presence for multiple room codes in one call', () => {
      joinVr(registry, 'room-a', 'vr-a')
      joinConsole(registry, 'room-b', 'console-b')

      expect(registry.getVrPresence(['room-a', 'room-b', 'room-c'])).toEqual({
        'room-a': true,
        'room-b': false,
        'room-c': false,
      })
    })
  })

  describe('authorizeRelay outcomes', () => {
    it('authorizes relay only for the current Active Role Peer', () => {
      joinConsole(registry, 'relay-room', 'console-1')

      expect(
        authorizeRelay(
          registry,
          'relay-room',
          'console-1',
          ROOM_PEER_ROLE.Console,
        ),
      ).toEqual({
        kind: 'relay_authorized',
        activePeerSocketId: 'console-1',
      })

      expect(
        authorizeRelay(
          registry,
          'relay-room',
          'console-stale',
          ROOM_PEER_ROLE.Console,
        ),
      ).toEqual({
        kind: 'relay_blocked',
        reason: 'not_active_role_peer',
        activePeerSocketId: 'console-1',
      })
    })

    it('blocks relay when the room does not exist', () => {
      expect(
        authorizeRelay(
          registry,
          'missing-relay-room',
          'console-1',
          ROOM_PEER_ROLE.Console,
        ),
      ).toEqual({
        kind: 'relay_blocked',
        reason: 'room_not_found',
        activePeerSocketId: null,
      })
    })
  })
})
