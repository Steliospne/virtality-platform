import {
  createEmptyRoleSlots,
  isRoomComplete,
  isRoomEmpty,
  ROOM_PEER_ROLE,
  type Room,
  type RoomPeerRole,
  type RoomRoleSlots,
} from '@virtality/shared/types'

const DEFAULT_ROOM_TTL_MS = 5 * 60 * 60 * 1000

export type RoleSlotJoinedOutcome = {
  kind: 'role_slot_joined'
  roomCode: string
  roomPeerRole: RoomPeerRole
  activePeerSocketId: string
  roomComplete: boolean
}

export type RolePeerReplacedOutcome = {
  kind: 'role_peer_replaced'
  roomCode: string
  roomPeerRole: RoomPeerRole
  replacedPeerSocketId: string
  activePeerSocketId: string
  roomComplete: boolean
}

export type JoinRoleSlotOutcome =
  | RoleSlotJoinedOutcome
  | RolePeerReplacedOutcome

export type StaleDisconnectIgnoredOutcome = {
  kind: 'stale_disconnect_ignored'
  roomCode: string
  roomPeerRole: RoomPeerRole
  peerSocketId: string
  activePeerSocketId: string | null
}

export type RoleSlotClearedOutcome = {
  kind: 'role_slot_cleared'
  roomCode: string
  roomPeerRole: RoomPeerRole
  departedPeerSocketId: string
  roomComplete: boolean
}

export type RoomDeletedOutcome = {
  kind: 'room_deleted'
  roomCode: string
  reason: 'both_role_slots_empty'
}

export type DisconnectRolePeerOutcome =
  | StaleDisconnectIgnoredOutcome
  | RoleSlotClearedOutcome
  | RoomDeletedOutcome
  | { kind: 'room_not_found'; roomCode: string }

export type RoomSnapshot = {
  roomCode: string
  createdAt: number
  roleSlots: RoomRoleSlots
  roomComplete: boolean
  roomEmpty: boolean
}

export type RelayAuthorizedOutcome = {
  kind: 'relay_authorized'
  activePeerSocketId: string
}

export type RelayBlockedOutcome = {
  kind: 'relay_blocked'
  reason: 'room_not_found' | 'not_active_role_peer'
  activePeerSocketId: string | null
}

export type RelayAuthorizationOutcome =
  | RelayAuthorizedOutcome
  | RelayBlockedOutcome

export type DeviceStatus = 'active' | 'inactive'

export type RoleSlotPeerLogContext = {
  consoleActivePeerSocketId: string | null
  vrActivePeerSocketId: string | null
}

export const EMPTY_ROLE_SLOT_PEER_LOG_CONTEXT: RoleSlotPeerLogContext = {
  consoleActivePeerSocketId: null,
  vrActivePeerSocketId: null,
}

export type RoomEvictedOutcome = {
  kind: 'room_evicted'
  roomCode: string
  reason: 'ttl_expired' | 'both_role_slots_empty'
  ageMs: number
} & RoleSlotPeerLogContext

export type RoleSlotRoomRegistry = {
  reset(): void
  hasRoom(roomCode: string): boolean
  getActiveRoomCount(): number
  listRoomSnapshots(): RoomSnapshot[]
  joinRoleSlot(input: RoleSlotPeerInput): JoinRoleSlotOutcome
  disconnectRolePeer(input: RoleSlotPeerInput): DisconnectRolePeerOutcome
  getRoomSnapshot(roomCode: string): RoomSnapshot | null
  getDeviceStatus(roomCode: string): DeviceStatus
  getVrPresence(roomCodes: string[]): Record<string, boolean>
  authorizeRelay(input: RoleSlotPeerInput): RelayAuthorizationOutcome
  evictStaleRooms(now?: number): RoomEvictedOutcome[]
}

export type SeededRoom = {
  roomCode: string
  createdAt: number
  roleSlots?: RoomRoleSlots
}

export type CreateRoleSlotRoomRegistryOptions = {
  roomTtlMs?: number
  seedRooms?: SeededRoom[]
}

export type RoleSlotPeerInput = {
  roomCode: string
  peerSocketId: string
  roomPeerRole: RoomPeerRole
}

export function roleSlotPeerLogContext(
  roleSlots: RoomRoleSlots,
): RoleSlotPeerLogContext {
  return {
    consoleActivePeerSocketId:
      roleSlots[ROOM_PEER_ROLE.Console].activePeerSocketId,
    vrActivePeerSocketId: roleSlots[ROOM_PEER_ROLE.Vr].activePeerSocketId,
  }
}

function toRoomSnapshot(roomCode: string, room: Room): RoomSnapshot {
  return {
    roomCode,
    createdAt: room.createdAt,
    roleSlots: room.roleSlots,
    roomComplete: isRoomComplete(room.roleSlots),
    roomEmpty: isRoomEmpty(room.roleSlots),
  }
}

export function createRoleSlotRoomRegistry(
  options: CreateRoleSlotRoomRegistryOptions = {},
): RoleSlotRoomRegistry {
  const roomTtlMs = options.roomTtlMs ?? DEFAULT_ROOM_TTL_MS
  const rooms = new Map<string, Room>()

  for (const seededRoom of options.seedRooms ?? []) {
    rooms.set(seededRoom.roomCode, {
      id: seededRoom.roomCode,
      createdAt: seededRoom.createdAt,
      roleSlots: seededRoom.roleSlots ?? createEmptyRoleSlots(),
    })
  }

  function blockRelay(
    reason: RelayBlockedOutcome['reason'],
    activePeerSocketId: string | null,
  ): RelayBlockedOutcome {
    return { kind: 'relay_blocked', reason, activePeerSocketId }
  }

  function getOrCreateRoom(roomCode: string): Room {
    const existingRoom = rooms.get(roomCode)
    if (existingRoom) {
      return existingRoom
    }

    const room: Room = {
      id: roomCode,
      createdAt: Date.now(),
      roleSlots: createEmptyRoleSlots(),
    }
    rooms.set(roomCode, room)
    return room
  }

  return {
    reset() {
      rooms.clear()
    },

    hasRoom(roomCode) {
      return rooms.has(roomCode)
    },

    getActiveRoomCount() {
      return rooms.size
    },

    listRoomSnapshots() {
      return Array.from(rooms, ([roomCode, room]) =>
        toRoomSnapshot(roomCode, room),
      )
    },

    joinRoleSlot({ roomCode, peerSocketId, roomPeerRole }) {
      const room = getOrCreateRoom(roomCode)
      const roleSlot = room.roleSlots[roomPeerRole]
      const replacedPeerSocketId = roleSlot.activePeerSocketId

      roleSlot.activePeerSocketId = peerSocketId
      const roomComplete = isRoomComplete(room.roleSlots)

      if (replacedPeerSocketId !== null) {
        return {
          kind: 'role_peer_replaced',
          roomCode,
          roomPeerRole,
          replacedPeerSocketId,
          activePeerSocketId: peerSocketId,
          roomComplete,
        }
      }

      return {
        kind: 'role_slot_joined',
        roomCode,
        roomPeerRole,
        activePeerSocketId: peerSocketId,
        roomComplete,
      }
    },

    disconnectRolePeer({ roomCode, peerSocketId, roomPeerRole }) {
      const room = rooms.get(roomCode)
      if (!room) {
        return { kind: 'room_not_found', roomCode }
      }

      const roleSlot = room.roleSlots[roomPeerRole]

      if (roleSlot.activePeerSocketId !== peerSocketId) {
        return {
          kind: 'stale_disconnect_ignored',
          roomCode,
          roomPeerRole,
          peerSocketId,
          activePeerSocketId: roleSlot.activePeerSocketId,
        }
      }

      roleSlot.activePeerSocketId = null

      if (isRoomEmpty(room.roleSlots)) {
        rooms.delete(roomCode)
        return {
          kind: 'room_deleted',
          roomCode,
          reason: 'both_role_slots_empty',
        }
      }

      return {
        kind: 'role_slot_cleared',
        roomCode,
        roomPeerRole,
        departedPeerSocketId: peerSocketId,
        roomComplete: isRoomComplete(room.roleSlots),
      }
    },

    getRoomSnapshot(roomCode) {
      const room = rooms.get(roomCode)
      if (!room) {
        return null
      }

      return toRoomSnapshot(roomCode, room)
    },

    getDeviceStatus(roomCode) {
      const room = rooms.get(roomCode)
      if (!room || !isRoomComplete(room.roleSlots)) {
        return 'inactive'
      }

      return 'active'
    },

    getVrPresence(roomCodes) {
      const presence: Record<string, boolean> = {}

      for (const roomCode of roomCodes) {
        const room = rooms.get(roomCode)
        presence[roomCode] =
          room?.roleSlots[ROOM_PEER_ROLE.Vr].activePeerSocketId != null
      }

      return presence
    },

    authorizeRelay({ roomCode, peerSocketId, roomPeerRole }) {
      const room = rooms.get(roomCode)
      if (!room) {
        return blockRelay('room_not_found', null)
      }

      const activePeerSocketId = room.roleSlots[roomPeerRole].activePeerSocketId
      if (activePeerSocketId !== peerSocketId) {
        return blockRelay('not_active_role_peer', activePeerSocketId)
      }

      return {
        kind: 'relay_authorized',
        activePeerSocketId,
      }
    },

    evictStaleRooms(now = Date.now()) {
      const evictedRooms: RoomEvictedOutcome[] = []

      rooms.forEach((room, roomCode) => {
        const ageMs = now - room.createdAt
        const ttlExpired = ageMs > roomTtlMs
        const roomEmpty = isRoomEmpty(room.roleSlots)

        if (!ttlExpired && !roomEmpty) {
          return
        }

        rooms.delete(roomCode)
        evictedRooms.push({
          kind: 'room_evicted',
          roomCode,
          reason: ttlExpired ? 'ttl_expired' : 'both_role_slots_empty',
          ageMs,
          ...roleSlotPeerLogContext(room.roleSlots),
        })
      })

      return evictedRooms
    },
  }
}
