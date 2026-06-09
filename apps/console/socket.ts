'use client'
import { io, SocketOptions, ManagerOptions } from 'socket.io-client'
import { SocketWithQuery } from './types/models'
import { ROOM_EVENT, getSocketUrl } from '@virtality/shared/types'

const connectionURL = getSocketUrl()

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

  socket.on(ROOM_EVENT.MemberLeft, (payload) =>
    console.log('member left:', payload),
  )
  socket.on(ROOM_EVENT.RoomJoined, (payload) =>
    console.log('room joined:', payload),
  )
  socket.on(ROOM_EVENT.RoomComplete, (payload) =>
    console.log('room complete:', payload),
  )

  return socket as SocketWithQuery
}
