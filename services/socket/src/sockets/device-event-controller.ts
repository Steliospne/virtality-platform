import { Socket } from 'socket.io'
import {
  PROGRAM_RELAY,
  GAME_RELAY,
  CASTING_RELAY,
  CONNECTION_EVENT,
  ROOM_EVENT,
  type RelayEventMap,
  type Room,
  type DeviceStatusResponse,
  type RoomJoinedPayload,
  type MemberJoinedPayload,
  type RoomCompletePayload,
  type MemberLeftPayload,
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

// ── Relay registration ─────────────────────────────────────────────────────

function registerRelayEvents(
  eventMap: RelayEventMap,
  roomCode: string | string[],
  socket: Socket,
) {
  for (const key in eventMap) {
    const entry = eventMap[key]
    logger.debug('registerRelayEvents', {
      eventName: entry.name,
      roomCode,
      socketId: socket.id,
    })
    socket.on(entry.name, (payload: unknown) => {
      logger.info('socket.relay.emit', {
        eventName: entry.name,
        agent: socket.handshake.query?.agent ?? 'unknown',
        roomCode,
        socketId: socket.id,
        hasPayload: payload !== undefined,
        payload,
      })
      socket.to(roomCode).emit(entry.name, entry.payload ? payload : undefined)
    })
  }
}

// ── Room lifecycle ─────────────────────────────────────────────────────────

function registerRoomEvents(roomCode: string, room: Room, socket: Socket) {
  socket.emit(ROOM_EVENT.RoomJoined, {
    roomCode,
    memberId: socket.id,
  } satisfies RoomJoinedPayload)

  socket.to(roomCode).emit(ROOM_EVENT.MemberJoined, {
    memberId: socket.id,
    timestamp: Date.now(),
  } satisfies MemberJoinedPayload)

  if (room.members === 2) {
    socket.to(roomCode).emit(ROOM_EVENT.RoomComplete, {
      roomCode,
      timestamp: Date.now(),
    } satisfies RoomCompletePayload)
    logger.info('socket.room.complete', {
      roomCode,
      socketId: socket.id,
      members: room.members,
    })
  }

  socket.on(CONNECTION_EVENT.DISCONNECTION, () => {
    logger.info('socket.connection.closed', {
      roomCode,
      socketId: socket.id,
    })
    if (!activeRooms.has(roomCode)) return
    const current = activeRooms.get(roomCode)!
    current.members -= 1

    if (socket.id === current.firstMemberId) current.firstMemberId = null
    else current.secondMemberId = null

    if (current.members <= 0) {
      activeRooms.delete(roomCode)
      logger.info('socket.room.deleted', {
        roomCode,
      })
    } else {
      activeRooms.set(roomCode, current)
      socket.to(roomCode).emit(ROOM_EVENT.MemberLeft, {
        memberId: socket.id,
        timestamp: Date.now(),
      } satisfies MemberLeftPayload)
      logger.info('socket.room.member_left', {
        roomCode,
        socketId: socket.id,
        members: current.members,
      })
    }
  })
}

// ── Connection‑level events ────────────────────────────────────────────────

function registerConnectionEvents(roomCode: string, socket: Socket) {
  socket.on(
    CONNECTION_EVENT.DEVICE_STATUS,
    (_payload: unknown, ack?: (res: DeviceStatusResponse) => void) => {
      const currentRoom = activeRooms.get(roomCode)
      const isOtherMemberPresent = !!currentRoom && currentRoom.members === 2
      if (typeof ack === 'function') {
        ack({ status: isOtherMemberPresent ? 'active' : 'inactive' })
      }
    },
  )
}

// ── Public API ─────────────────────────────────────────────────────────────

export function connectionHandler(socket: Socket) {
  const isSim = process.env.SIM === 'true'

  const roomCode = socket.handshake.query.roomCode as string
  const agent = socket.handshake.query?.agent ?? 'unknown'

  logger.info('socket.connection.open', {
    socketId: socket.id,
    roomCode: roomCode || 'missing',
    hasRoomCode: Boolean(roomCode),
    agent,
    simulationEnabled: isSim,
  })

  if (!roomCode) {
    logger.warn('socket.connection.rejected', {
      socketId: socket.id,
      reason: 'missing_room_code',
      agent,
    })
    socket.emit(CONNECTION_EVENT.ERROR, {
      message: 'Room code was not received.',
    })
    socket.disconnect()
    return
  }

  if (!activeRooms.has(roomCode)) {
    activeRooms.set(roomCode, {
      id: roomCode,
      firstMemberId: null,
      secondMemberId: null,
      createdAt: Date.now(),
      members: 0,
    })
  }

  const room = activeRooms.get(roomCode)!

  if (room.members >= 2) {
    logger.warn('socket.room.full', {
      socketId: socket.id,
      roomCode,
      handshakeQuery: socket.handshake.query,
    })
    socket.emit(CONNECTION_EVENT.ERROR, { message: 'Room is full' })
    socket.disconnect()
    return
  }

  socket.join(roomCode)
  room.members += 1
  if (room.members <= 1) {
    activeRooms.set(roomCode, { ...room, firstMemberId: socket.id })
  } else {
    activeRooms.set(roomCode, { ...room, secondMemberId: socket.id })
  }

  logger.info('socket.room.joined', {
    socketId: socket.id,
    roomCode,
    members: activeRooms.get(roomCode)?.members ?? room.members,
  })

  registerRoomEvents(roomCode, activeRooms.get(roomCode)!, socket)
  registerConnectionEvents(roomCode, socket)

  if (isSim) {
    for (const key in vrCommSim) {
      vrCommSim[key as keyof typeof vrCommSim](roomCode, socket)
    }
  } else {
    registerRelayEvents(PROGRAM_RELAY, roomCode, socket)
    // registerRelayEvents(GAME_RELAY, roomCode, socket)
    registerRelayEvents(CASTING_RELAY, roomCode, socket)
    registerRelayEvents(DEVICE_RELAY, roomCode, socket)
  }
}

// ── Stale room cleanup ────────────────────────────────────────────────────

setInterval(
  () => {
    const now = Date.now()
    activeRooms.forEach((room, code) => {
      if (now - room.createdAt > 5 * 60 * 60 * 1000 || room.members === 0) {
        activeRooms.delete(code)
        logger.info('socket.room.cleaned', {
          roomCode: code,
          ageMs: now - room.createdAt,
          members: room.members,
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
