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
  resetActiveRoomsForTests,
} from '../sockets/device-event-controller'

type TestQuery = {
  roomCode: string
  role?: string
}

function waitForEvent<T>(
  socket: ClientSocket,
  event: string,
  timeoutMs = 3000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for event "${event}"`))
    }, timeoutMs)

    socket.once(event, (payload: T) => {
      clearTimeout(timer)
      resolve(payload)
    })
  })
}

function waitForConnect(socket: ClientSocket, timeoutMs = 3000): Promise<void> {
  if (socket.connected) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for socket connect'))
    }, timeoutMs)

    socket.once('connect', () => {
      clearTimeout(timer)
      resolve()
    })
    socket.once('connect_error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

function waitForDisconnect(
  socket: ClientSocket,
  timeoutMs = 3000,
): Promise<void> {
  if (!socket.connected) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for socket disconnect'))
    }, timeoutMs)

    socket.once('disconnect', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

describe('role-slot room entry', () => {
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

  function connectClient(query: TestQuery): ClientSocket {
    const client = ioClient(`http://127.0.0.1:${port}`, {
      query,
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    })
    clients.push(client)
    return client
  }

  it('lets console and vr join the same room and signals room complete', async () => {
    const roomCode = 'role-pair-room'
    const consoleSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })
    const vrSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    const consoleJoined = waitForEvent<{ roomCode: string }>(
      consoleSocket,
      ROOM_EVENT.RoomJoined,
    )
    const vrJoined = waitForEvent<{ roomCode: string }>(
      vrSocket,
      ROOM_EVENT.RoomJoined,
    )
    const consoleComplete = waitForEvent<{ roomCode: string }>(
      consoleSocket,
      ROOM_EVENT.RoomComplete,
    )

    await Promise.all([waitForConnect(consoleSocket), consoleJoined])
    await Promise.all([waitForConnect(vrSocket), vrJoined])
    await expect(consoleComplete).resolves.toMatchObject({ roomCode })
  })

  it('rejects connections with a missing role', async () => {
    const socket = connectClient({ roomCode: 'missing-role-room' })

    const errorPromise = waitForEvent<{ message: string }>(
      socket,
      CONNECTION_EVENT.ERROR,
    )
    const disconnectPromise = waitForDisconnect(socket)

    await expect(errorPromise).resolves.toEqual({
      message: 'Room peer role is required.',
    })
    await disconnectPromise
    expect(socket.connected).toBe(false)
  })

  it('rejects connections with an unknown role', async () => {
    const socket = connectClient({
      roomCode: 'unknown-role-room',
      role: 'client',
    })

    const errorPromise = waitForEvent<{ message: string }>(
      socket,
      CONNECTION_EVENT.ERROR,
    )
    const disconnectPromise = waitForDisconnect(socket)

    await expect(errorPromise).resolves.toEqual({
      message: 'Unknown room peer role.',
    })
    await disconnectPromise
    expect(socket.connected).toBe(false)
  })

  it('rejects a second peer for an occupied role slot', async () => {
    const roomCode = 'occupied-role-slot'
    const firstConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })
    const firstJoined = waitForEvent(firstConsole, ROOM_EVENT.RoomJoined)
    await Promise.all([waitForConnect(firstConsole), firstJoined])

    const secondConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    const errorPromise = waitForEvent<{ message: string }>(
      secondConsole,
      CONNECTION_EVENT.ERROR,
    )
    const disconnectPromise = waitForDisconnect(secondConsole)

    await expect(errorPromise).resolves.toEqual({
      message: 'Room is full',
    })
    await disconnectPromise
    expect(secondConsole.connected).toBe(false)
    expect(firstConsole.connected).toBe(true)
  })
})
