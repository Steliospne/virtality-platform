import { createServer, type Server as HttpServer } from 'http'
import { type AddressInfo } from 'node:net'
import { Server } from 'socket.io'
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import {
  CONNECTION_EVENT,
  ROOM_EVENT,
  ROOM_PEER_ROLE,
} from '@virtality/shared/types'
import {
  connectionHandler,
  hasActiveRoomForTests,
  resetActiveRoomsForTests,
} from './device-event-controller'
import { waitForConnect, waitForEvent } from './socket-test-helpers'

describe('device event controller connection handler', () => {
  let httpServer: HttpServer
  let port: number
  const clients: ClientSocket[] = []

  beforeAll(async () => {
    httpServer = createServer()
    const io = new Server(httpServer, {
      cors: { origin: '*' },
    })
    io.on(CONNECTION_EVENT.CONNECTION, connectionHandler)

    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => resolve())
    })
    port = (httpServer.address() as AddressInfo).port
  })

  afterAll(async () => {
    for (const client of clients) {
      client.disconnect()
    }
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  })

  beforeEach(() => {
    resetActiveRoomsForTests()
  })

  afterEach(() => {
    while (clients.length > 0) {
      clients.pop()?.disconnect()
    }
  })

  function connectClient(query: {
    roomCode: string
    role?: string
  }): ClientSocket {
    const client = ioClient(`http://127.0.0.1:${port}`, {
      query,
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    })
    clients.push(client)
    return client
  }

  it('creates registry room state on first join and replaces occupied role slots', async () => {
    const roomCode = 'registry-connection-room'
    const firstConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(firstConsole),
      waitForEvent(firstConsole, ROOM_EVENT.RoomJoined),
    ])
    expect(hasActiveRoomForTests(roomCode)).toBe(true)

    const secondConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(secondConsole),
      waitForEvent(firstConsole, ROOM_EVENT.ReplacementNotice),
      waitForEvent(secondConsole, ROOM_EVENT.RoomJoined),
    ])

    expect(hasActiveRoomForTests(roomCode)).toBe(true)
    expect(secondConsole.connected).toBe(true)
  })
})
