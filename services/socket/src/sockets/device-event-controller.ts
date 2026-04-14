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
} from '@virtality/shared/types'
import vrCommSim from './vrCommsTesting'

const activeRooms: Map<string, Room> = new Map()

// ── Relay registration ─────────────────────────────────────────────────────

function registerRelayEvents(
  eventMap: RelayEventMap,
  roomCode: string | string[],
  socket: Socket,
) {
  for (const key in eventMap) {
    const entry = eventMap[key]
    socket.on(entry.name, (payload: unknown) => {
      console.log(
        `[EMIT] Event: ${entry.name} by ${socket.handshake.query?.agent} to room: ${roomCode}`,
      )
      if (payload !== undefined) console.log(`[PAYLOAD]`, payload)
      socket
        .to(roomCode)
        .emit(entry.name, entry.payload ? payload : undefined)
    })
  }
}

// ── Room lifecycle ─────────────────────────────────────────────────────────

function registerRoomEvents(
  roomCode: string,
  room: Room,
  socket: Socket,
) {
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
    console.log('room complete')
  }

  socket.on(CONNECTION_EVENT.DISCONNECTION, () => {
    console.log('Disconnected:', socket.id)
    if (!activeRooms.has(roomCode)) return
    const current = activeRooms.get(roomCode)!
    current.members -= 1

    if (socket.id === current.firstMemberId) current.firstMemberId = null
    else current.secondMemberId = null

    if (current.members <= 0) {
      activeRooms.delete(roomCode)
    } else {
      activeRooms.set(roomCode, current)
      socket.to(roomCode).emit(ROOM_EVENT.MemberLeft, {
        memberId: socket.id,
        timestamp: Date.now(),
      } satisfies MemberLeftPayload)
    }
  })
}

// ── Connection‑level events ────────────────────────────────────────────────

function registerConnectionEvents(roomCode: string, socket: Socket) {
  socket.on(
    CONNECTION_EVENT.DEVICE_STATUS,
    (
      _payload: unknown,
      ack?: (res: DeviceStatusResponse) => void,
    ) => {
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

  console.log(`[CONNECTION] Event: New connection ${socket.id}`)

  const roomCode = socket.handshake.query.roomCode as string

  console.log(
    '[CONNECTION] Event: room code ',
    roomCode ? true : false,
    'from',
    socket.id,
  )

  if (!roomCode) {
    socket.emit(CONNECTION_EVENT.ERROR, { message: 'Room code was not received.' })
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
    console.log('id: ', socket.id, 'options: ', socket.handshake.query, 'Room is full')
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

  registerRoomEvents(roomCode, activeRooms.get(roomCode)!, socket)
  registerConnectionEvents(roomCode, socket)

  if (isSim) {
    for (const key in vrCommSim) {
      vrCommSim[key as keyof typeof vrCommSim](roomCode, socket)
    }
  } else {
    registerRelayEvents(PROGRAM_RELAY, roomCode, socket)
    registerRelayEvents(GAME_RELAY, roomCode, socket)
    registerRelayEvents(CASTING_RELAY, roomCode, socket)
  }
}

// ── Stale room cleanup ────────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now()
  activeRooms.forEach((room, code) => {
    if (now - room.createdAt > 5 * 60 * 60 * 1000 || room.members === 0) {
      activeRooms.delete(code)
    }
  })
}, 30 * 60 * 1000)

setInterval(() => {
  console.log(activeRooms)
}, 0.5 * 60 * 1000)
