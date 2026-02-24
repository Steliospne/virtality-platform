'use client'
import { io, SocketOptions, ManagerOptions } from 'socket.io-client'
import { SocketWithQuery } from './types/models'

const connectionURL =
  process.env.NEXT_PUBLIC_ENV === 'development'
    ? 'http://localhost:8081'
    : process.env.NEXT_PUBLIC_SOCKET_URL

const socketOptions = {
  secure: true,
  autoConnect: false,
  reconnectionAttempts: 5,
  query: {
    roomCode: '',
    agent: 'console',
  },
} satisfies Partial<ManagerOptions & SocketOptions>

export function createSocket(): SocketWithQuery {
  const socket = io(connectionURL, {
    ...socketOptions,
  })

  socket.on('memberLeft', (payload) => console.log('member left:', payload))
  socket.on('roomJoined', (payload) => console.log('room joined:', payload))
  socket.on('roomComplete', (payload) => console.log('room complete:', payload))

  return socket as SocketWithQuery
}
