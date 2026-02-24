import { DefaultEventsMap, Server, Socket } from 'socket.io'
import {
  _EVENT,
  CONNECTION_EVENT,
  EventKey,
  GAME_EVENT,
  GameEvent,
  Room,
} from '../types/models'
import { createEventHandler } from './vrComms'
import vrCommSim from './vrCommsTesting'

const activeRooms: Map<string, Room> = new Map()
// Socket.IO connection handler
export const connectionHandler = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
) => {
  const { SIM } = process.env

  console.log(`[CONNECTION] Event: New connection ${socket.id}`)

  const host = socket.request.headers.host
  const isLocalhost = host?.includes('localhost')
  console.log(
    'Host: ',
    socket.request.headers.host,
    'isLocalhost: ',
    isLocalhost,
  )

  // Get the room code from query parameters
  const roomCode = socket.handshake.query.roomCode as string

  console.log(
    '[CONNECTION] Event: room code ',
    roomCode ? true : false,
    'from',
    socket.id,
  )

  if (!roomCode) {
    const message = 'Room code was not received.'
    socket.emit(CONNECTION_EVENT.ERROR, { message })
    console.log('error', message)
    socket.disconnect()
    return
  }

  // Create room if it doesn't exist
  if (!activeRooms.has(roomCode)) {
    activeRooms.set(roomCode, {
      id: roomCode,
      firstMemberId: null,
      secondMemberId: null,
      createdAt: Date.now(),
      members: 0,
    })
  }

  // Get room data
  const room = activeRooms.get(roomCode)

  if (!room) throw Error('Room is missing.')

  // Check if room is full (limit to 2 members)
  if (room.members >= 2) {
    console.log(
      'id: ',
      socket.id,
      'options: ',
      socket.handshake.query,
      'Room is full',
    )
    socket.emit(CONNECTION_EVENT.ERROR, { message: 'Room is full' })
    socket.disconnect()
    return
  }

  // Join the room
  socket.join(roomCode)
  room.members += 1
  if (room.members <= 1)
    activeRooms.set(roomCode, { ...room, firstMemberId: socket.id })
  else activeRooms.set(roomCode, { ...room, secondMemberId: socket.id })

  // Notify the client they've joined
  socket.emit('roomJoined', {
    roomCode,
    memberId: socket.id,
  })

  // Notify other room members about the new connection
  socket.to(roomCode).emit('memberJoined', {
    memberId: socket.id,
    timestamp: Date.now(),
  })

  socket.on(
    CONNECTION_EVENT.DEVICE_STATUS,
    (
      _payload: unknown,
      ack?: (res: { status: 'active' | 'inactive' }) => void,
    ) => {
      const currentRoom = activeRooms.get(roomCode)
      const isOtherMemberPresent = !!currentRoom && currentRoom.members === 2

      // ensure ack exists before calling
      if (typeof ack === 'function') {
        ack({ status: isOtherMemberPresent ? 'active' : 'inactive' })
      }
    },
  )

  // If this is the second member, notify both that the room is complete
  if (room.members === 2) {
    io.to(roomCode).emit('roomComplete', {
      roomCode,
      timestamp: Date.now(),
    })
    console.log('room complete')
  }

  const EventList = SIM === 'true' ? vrCommSim : _EVENT

  for (const key in EventList) {
    if (SIM === 'true') {
      vrCommSim[key as keyof typeof vrCommSim](roomCode, socket)
    } else {
      console.log(
        `[REGISTER] Event: ${
          _EVENT[key as EventKey].name
        } for key: ${key}, payload: ${_EVENT[key as EventKey].payload}`,
      )
      createEventHandler(key as EventKey, _EVENT, roomCode, socket)
    }
  }

  for (const key in GAME_EVENT) {
    console.log(
      `[REGISTER] Event: ${
        GAME_EVENT[key as GameEvent].name
      } for key: ${key}, payload: ${GAME_EVENT[key as GameEvent].payload}`,
    )
    createEventHandler(key as GameEvent, GAME_EVENT, roomCode, socket)
  }

  // socket.onAny((event, ...args) => {
  //   console.log(`[onAny] Received event: ${event}`, ...args);
  // });

  socket.on(CONNECTION_EVENT.DISCONNECTION, () => {
    console.log('Disconnected:', socket.id)
    if (activeRooms.has(roomCode)) {
      const room = activeRooms.get(roomCode)
      if (!room) throw Error('Room is missing.')
      room.members -= 1

      const { firstMemberId } = room

      if (socket.id === firstMemberId) room.firstMemberId = null
      else room.secondMemberId = null

      // Remove room if empty
      if (room.members <= 0) {
        activeRooms.delete(roomCode)
      } else {
        activeRooms.set(roomCode, room)
        // Notify remaining member
        socket.to(roomCode).emit('memberLeft', {
          memberId: socket.id,
          timestamp: Date.now(),
        })
      }
    }
  })
}

// Clean up stale rooms periodically
setInterval(
  () => {
    const now = Date.now()
    activeRooms.forEach((room, code) => {
      // Remove rooms older than 5 hours or with 0 members
      if (now - room.createdAt > 5 * 60 * 60 * 1000 || room.members === 0) {
        activeRooms.delete(code)
      }
    })
  },
  30 * 60 * 1000,
) // Run every 30 minutes

setInterval(
  () => {
    console.log(activeRooms)
  },
  0.5 * 60 * 1000,
)
