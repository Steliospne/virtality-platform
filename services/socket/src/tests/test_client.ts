import { io, ManagerOptions, SocketOptions } from 'socket.io-client'
import { _EVENT } from '../types/models'

const { ROOM_CODE } = process.env

if (!ROOM_CODE) throw Error('Missing ROOM_CODE variable!')

const socketOptions: Partial<ManagerOptions & SocketOptions> = {
  query: {
    roomCode: ROOM_CODE,
  },
}

const state = {
  paired: false,
}

const socket = io('http://localhost:8080', socketOptions)

socket.on('connect', () => {
  console.log(`[TEST_CLIENT] connected as ${socket.id}`)
})

socket.on('roomComplete', () => {
  setTimeout(() => {
    socket.emit(_EVENT.SendDeviceId.name, '1752642287897')
  }, 2000)
})

// socket.on();

socket.onAny((event, ...args) => {
  console.log(`[onAny] Received event: ${event}`, ...args)
})
