'use client'
import { io, SocketOptions, ManagerOptions } from 'socket.io-client'
import { SocketWithQuery } from './types/models'
import { SOCKET_URL, SOCKET_URL_LOCAL } from '@virtality/shared/types'

const env = process.env.NEXT_PUBLIC_ENV || 'development'

const connectionURL =
  env === 'production' || env === 'preview' ? SOCKET_URL : SOCKET_URL_LOCAL

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
