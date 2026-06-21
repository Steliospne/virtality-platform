import { Socket } from 'socket.io'
import {
  PROGRAM_RELAY,
  CASTING_RELAY,
  CONNECTION_EVENT,
  ROOM_EVENT,
  ROOM_PEER_ROLE,
  type RelayEventMap,
  type Room,
  type RoomPeerRole,
  type DeviceStatusResponse,
  type RoomJoinedPayload,
  type MemberJoinedPayload,
  type RoomCompletePayload,
  type MemberLeftPayload,
  type ReplacementNoticePayload,
  createEmptyRoleSlots,
  isRoomComplete,
  isRoomEmpty,
  parseRoomPeerRole,
  DEVICE_RELAY,
} from '@virtality/shared/types'
import { createAppLogger } from '@virtality/shared/observability'
import vrCommSim from './vrCommsTesting'

const activeRooms: Map<string, Room> = new Map()
const logger = createAppLogger({
  serviceName: 'socket',
  defaultAttributes: {
    component: 'device-event-controller',
  },
})

type SocketWithRole = Socket & {
  data: {
    roomPeerRole?: RoomPeerRole
  }
}

export function resetActiveRoomsForTests() {
  activeRooms.clear()
}

export function hasActiveRoomForTests(roomCode: string): boolean {
  return activeRooms.has(roomCode)
}

// ── Relay registration ─────────────────────────────────────────────────────

function registerRelayEvents(
  eventMap: RelayEventMap,
  roomCode: string | string[],
  socket: SocketWithRole,
) {
  const resolvedRoomCode = Array.isArray(roomCode) ? roomCode[0] : roomCode

  for (const key in eventMap) {
    const entry = eventMap[key]
    logger.debug('registerRelayEvents', {
      role: socket.data.roomPeerRole ?? 'unknown',
      eventName: entry.name,
      roomCode: resolvedRoomCode,
      socketId: socket.id,
    })
    socket.on(entry.name, (payload: unknown) => {
      const roomPeerRole = socket.data.roomPeerRole as RoomPeerRole | undefined
      const room = activeRooms.get(resolvedRoomCode)

      if (!room || !roomPeerRole) {
        logger.warn('socket.relay.blocked', {
          eventName: entry.name,
          roomCode: resolvedRoomCode,
          socketId: socket.id,
          reason: 'missing_room_or_role',
        })
        return
      }

      const activePeerSocketId = room.roleSlots[roomPeerRole].activePeerSocketId

      if (activePeerSocketId !== socket.id) {
        logger.info('socket.relay.stale_peer_blocked', {
          eventName: entry.name,
          roomCode: resolvedRoomCode,
          socketId: socket.id,
          role: roomPeerRole,
          activePeerSocketId,
        })
        return
      }

      logger.info('socket.relay.emit', {
        eventName: entry.name,
        role: roomPeerRole,
        roomCode: resolvedRoomCode,
        socketId: socket.id,
        hasPayload: payload !== undefined,
        payload,
      })
      socket
        .to(resolvedRoomCode)
        .emit(entry.name, entry.payload ? payload : undefined)
    })
  }
}

// ── Room lifecycle ─────────────────────────────────────────────────────────

function registerRoomEvents(
  roomCode: string,
  room: Room,
  socket: SocketWithRole,
  roomPeerRole: RoomPeerRole,
  options: { emitMemberJoined?: boolean } = {},
) {
  const emitMemberJoined = options.emitMemberJoined ?? true

  socket.emit(ROOM_EVENT.RoomJoined, {
    roomCode,
    memberId: socket.id,
  } satisfies RoomJoinedPayload)

  if (emitMemberJoined) {
    socket.to(roomCode).emit(ROOM_EVENT.MemberJoined, {
      memberId: socket.id,
      timestamp: Date.now(),
    } satisfies MemberJoinedPayload)
  }

  if (isRoomComplete(room.roleSlots)) {
    socket.nsp.to(roomCode).emit(ROOM_EVENT.RoomComplete, {
      roomCode,
      timestamp: Date.now(),
    } satisfies RoomCompletePayload)
    logger.info('socket.room.complete', {
      roomCode,
      socketId: socket.id,
      role: roomPeerRole,
      consoleActivePeerSocketId:
        room.roleSlots[ROOM_PEER_ROLE.Console].activePeerSocketId,
      vrActivePeerSocketId:
        room.roleSlots[ROOM_PEER_ROLE.Vr].activePeerSocketId,
    })
  }

  socket.on(CONNECTION_EVENT.DISCONNECTION, () => {
    logger.info('socket.connection.closed', {
      roomCode,
      socketId: socket.id,
      role: roomPeerRole,
    })
    if (!activeRooms.has(roomCode)) return

    const current = activeRooms.get(roomCode)!
    const roleSlot = current.roleSlots[roomPeerRole]

    if (roleSlot.activePeerSocketId !== socket.id) {
      logger.info('socket.room.stale_disconnect_ignored', {
        roomCode,
        socketId: socket.id,
        role: roomPeerRole,
        activePeerSocketId: roleSlot.activePeerSocketId,
      })
      return
    }

    roleSlot.activePeerSocketId = null

    if (isRoomEmpty(current.roleSlots)) {
      activeRooms.delete(roomCode)
      logger.info('socket.room.deleted', {
        roomCode,
      })
      return
    }

    activeRooms.set(roomCode, current)
    socket.to(roomCode).emit(ROOM_EVENT.MemberLeft, {
      memberId: socket.id,
      timestamp: Date.now(),
    } satisfies MemberLeftPayload)
    logger.info('socket.room.role_slot_cleared', {
      roomCode,
      socketId: socket.id,
      role: roomPeerRole,
      consoleActivePeerSocketId:
        current.roleSlots[ROOM_PEER_ROLE.Console].activePeerSocketId,
      vrActivePeerSocketId:
        current.roleSlots[ROOM_PEER_ROLE.Vr].activePeerSocketId,
    })
  })
}

// ── Connection‑level events ────────────────────────────────────────────────

function registerConnectionEvents(roomCode: string, socket: Socket) {
  socket.on(
    CONNECTION_EVENT.DEVICE_STATUS,
    (_payload: unknown, ack?: (res: DeviceStatusResponse) => void) => {
      const currentRoom = activeRooms.get(roomCode)
      const isOppositeRolePeerPresent =
        !!currentRoom && isRoomComplete(currentRoom.roleSlots)
      if (typeof ack === 'function') {
        ack({ status: isOppositeRolePeerPresent ? 'active' : 'inactive' })
      }
    },
  )
}

function rejectConnection(
  socket: Socket,
  reason: string,
  message: string,
  details: Record<string, unknown> = {},
) {
  logger.warn('socket.connection.rejected', {
    socketId: socket.id,
    reason,
    ...details,
  })
  socket.emit(CONNECTION_EVENT.ERROR, { message })
  socket.disconnect()
}

const ROLE_PEER_REPLACED_LOG_EVENT = {
  [ROOM_PEER_ROLE.Vr]: 'socket.room.vr_role_peer_replaced',
  [ROOM_PEER_ROLE.Console]: 'socket.room.console_role_peer_replaced',
} as const satisfies Record<RoomPeerRole, string>

function replaceRolePeer(
  roomCode: string,
  room: Room,
  incomingSocket: SocketWithRole,
  roomPeerRole: RoomPeerRole,
) {
  const roleSlot = room.roleSlots[roomPeerRole]
  const replacedSocketId = roleSlot.activePeerSocketId!
  const replacedSocket = incomingSocket.nsp.sockets.get(replacedSocketId)

  roleSlot.activePeerSocketId = incomingSocket.id
  activeRooms.set(roomCode, room)
  incomingSocket.join(roomCode)

  logger.info(ROLE_PEER_REPLACED_LOG_EVENT[roomPeerRole], {
    roomCode,
    replacedSocketId,
    activePeerSocketId: incomingSocket.id,
    role: roomPeerRole,
    consoleActivePeerSocketId:
      room.roleSlots[ROOM_PEER_ROLE.Console].activePeerSocketId,
    vrActivePeerSocketId: room.roleSlots[ROOM_PEER_ROLE.Vr].activePeerSocketId,
  })

  if (replacedSocket) {
    replacedSocket.emit(ROOM_EVENT.ReplacementNotice, {
      roomCode,
      role: roomPeerRole,
      replacedBySocketId: incomingSocket.id,
      timestamp: Date.now(),
    } satisfies ReplacementNoticePayload)
    replacedSocket.disconnect(true)
  }

  registerRoomEvents(roomCode, room, incomingSocket, roomPeerRole, {
    emitMemberJoined: false,
  })
}

function registerSocketHandlers(
  roomCode: string,
  socket: SocketWithRole,
  isSim: boolean,
) {
  registerConnectionEvents(roomCode, socket)

  if (isSim) {
    for (const key in vrCommSim) {
      vrCommSim[key as keyof typeof vrCommSim](roomCode, socket)
    }
    return
  }

  registerRelayEvents(PROGRAM_RELAY, roomCode, socket)
  registerRelayEvents(CASTING_RELAY, roomCode, socket)
  registerRelayEvents(DEVICE_RELAY, roomCode, socket)
}

// ── Public API ─────────────────────────────────────────────────────────────

export function connectionHandler(socket: Socket) {
  const isSim = process.env.SIM === 'true'
  const socketWithRole = socket as SocketWithRole

  const roomCode = socket.handshake.query.roomCode as string
  const roleQuery = socket.handshake.query.role

  logger.info('socket.connection.open', {
    socketId: socket.id,
    roomCode: roomCode || 'missing',
    hasRoomCode: Boolean(roomCode),
    role: typeof roleQuery === 'string' ? roleQuery : 'missing',
    simulationEnabled: isSim,
  })

  if (!roomCode) {
    rejectConnection(
      socket,
      'missing_room_code',
      'Room code was not received.',
      {
        role: roleQuery,
      },
    )
    return
  }

  const roomPeerRole = parseRoomPeerRole(roleQuery)
  if (!roomPeerRole) {
    const message =
      roleQuery === undefined || roleQuery === ''
        ? 'Room peer role is required.'
        : 'Unknown room peer role.'
    rejectConnection(socket, 'invalid_room_peer_role', message, {
      roomCode,
      role: roleQuery,
    })
    return
  }

  socketWithRole.data.roomPeerRole = roomPeerRole

  if (!activeRooms.has(roomCode)) {
    activeRooms.set(roomCode, {
      id: roomCode,
      createdAt: Date.now(),
      roleSlots: createEmptyRoleSlots(),
    })
  }

  const room = activeRooms.get(roomCode)!
  const roleSlot = room.roleSlots[roomPeerRole]

  if (roleSlot.activePeerSocketId !== null) {
    replaceRolePeer(roomCode, room, socketWithRole, roomPeerRole)
    registerSocketHandlers(roomCode, socketWithRole, isSim)
    return
  }

  socket.join(roomCode)
  roleSlot.activePeerSocketId = socket.id
  activeRooms.set(roomCode, room)

  logger.info('socket.room.role_slot_joined', {
    socketId: socket.id,
    roomCode,
    role: roomPeerRole,
    consoleActivePeerSocketId:
      room.roleSlots[ROOM_PEER_ROLE.Console].activePeerSocketId,
    vrActivePeerSocketId: room.roleSlots[ROOM_PEER_ROLE.Vr].activePeerSocketId,
  })

  registerRoomEvents(roomCode, room, socketWithRole, roomPeerRole)
  registerSocketHandlers(roomCode, socketWithRole, isSim)
}

// ── Stale room cleanup ────────────────────────────────────────────────────

setInterval(
  () => {
    const now = Date.now()
    activeRooms.forEach((room, code) => {
      if (
        now - room.createdAt > 5 * 60 * 60 * 1000 ||
        isRoomEmpty(room.roleSlots)
      ) {
        activeRooms.delete(code)
        logger.info('socket.room.cleaned', {
          roomCode: code,
          ageMs: now - room.createdAt,
          consoleActivePeerSocketId:
            room.roleSlots[ROOM_PEER_ROLE.Console].activePeerSocketId,
          vrActivePeerSocketId:
            room.roleSlots[ROOM_PEER_ROLE.Vr].activePeerSocketId,
        })
      }
    })
  },
  30 * 60 * 1000,
)

setInterval(
  () => {
    if (activeRooms.size === 0) return

    logger.debug('socket.rooms.snapshot', {
      activeRoomCount: activeRooms.size,
      rooms: [...activeRooms.entries()],
    })
  },
  0.5 * 60 * 1000,
)
