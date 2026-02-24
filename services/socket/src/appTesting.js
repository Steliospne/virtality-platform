import { Server } from 'socket.io'
import express from 'express'
import { createServer } from 'http'
import vrCommsTesting from './sockets/vrCommsTesting.js'
// Initialize Socket.IO
const app = express
const httpServer = createServer(app)

const socketOptions = {
  cors: {
    origin: ['http://localhost:3000', 'https://www.virtality.app'],
  },
}

const io = new Server(httpServer, socketOptions)
const PORT = process.env.PORT || '8080'

const activeRooms = new Map()

const Event = {
  CONNECTION: 'connection',
  DISCONNECTION: 'disconnect',
  CONNECT_ERROR: 'onConnectError',
  ERROR: 'onError',
}

// Socket.IO connection handler
io.on(Event.CONNECTION, (socket) => {
  console.log(`New connection: ${socket.id}`)

  // Get the room code from query parameters
  const roomCode = socket.handshake.query.roomCode

  if (!roomCode) {
    const message = 'Room code was not received.'
    socket.emit(Event.CONNECT_ERROR, { message })
    console.log('error', message)
    socket.disconnect()
    return
  }

  socket.emit('connectAck')

  // Create room if it doesn't exist
  if (!activeRooms.has(roomCode)) {
    activeRooms.set(roomCode, {
      id: roomCode,
      createdAt: Date.now(),
      members: 0,
    })
  }

  // Get room data
  const room = activeRooms.get(roomCode)

  // Check if room is full (limit to 2 members)
  if (room.members >= 2) {
    socket.emit(Event.ERROR, { message: 'Room is full' })
    socket.disconnect()
    return
  }

  // Join the room
  socket.join(roomCode)
  room.members += 1
  activeRooms.set(roomCode, room)

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

  // If this is the second member, notify both that the room is complete
  if (room.members === 2) {
    io.to(roomCode).emit('roomComplete', {
      roomCode,
      timestamp: Date.now(),
    })
  }

  for (const method in vrCommsTesting) {
    vrCommsTesting[method](roomCode, socket)
  }

  socket.on(Event.DISCONNECTION, () => {
    console.log('Disconnected:', socket.id)
    socket.emit('disconnectAck')
    if (activeRooms.has(roomCode)) {
      const room = activeRooms.get(roomCode)
      room.members -= 1

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
})

// Clean up stale rooms periodically
setInterval(
  () => {
    const now = Date.now()
    activeRooms.forEach((room, code) => {
      // Remove rooms older than 24 hours or with 0 members
      if (now - room.createdAt > 24 * 60 * 60 * 1000 || room.members === 0) {
        activeRooms.delete(code)
      }
    })
  },
  30 * 60 * 1000,
) // Run every 30 minutes

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
