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
import { Socket as ServerSocket } from 'socket.io'
import {
  CASTING_EVENT,
  CONNECTION_EVENT,
  DEVICE_EVENT,
  PROGRAM_EVENT,
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

function expectNoEvent(
  socket: ClientSocket,
  event: string,
  windowMs = 500,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEvent = () => {
      clearTimeout(timer)
      reject(new Error(`Unexpected event "${event}" received`))
    }

    const timer = setTimeout(() => {
      socket.off(event, onEvent)
      resolve()
    }, windowMs)

    socket.on(event, onEvent)
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
})

describe('Console role peer replacement', () => {
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

  it('replaces the active console peer instead of rejecting the room as full', async () => {
    const roomCode = 'console-replacement-room'
    const vrSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })
    const firstConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(vrSocket),
      waitForEvent(vrSocket, ROOM_EVENT.RoomJoined),
      waitForConnect(firstConsole),
      waitForEvent(firstConsole, ROOM_EVENT.RoomJoined),
      waitForEvent(vrSocket, ROOM_EVENT.RoomComplete),
    ])

    const secondConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    const replacementNotice = waitForEvent<{
      roomCode: string
      role: string
      replacedBySocketId: string
    }>(firstConsole, ROOM_EVENT.ReplacementNotice)
    const secondConsoleJoined = waitForEvent(
      secondConsole,
      ROOM_EVENT.RoomJoined,
    )
    const firstConsoleDisconnected = waitForDisconnect(firstConsole)
    const vrMemberLeft = expectNoEvent(vrSocket, ROOM_EVENT.MemberLeft)

    await Promise.all([
      waitForConnect(secondConsole),
      replacementNotice,
      secondConsoleJoined,
      firstConsoleDisconnected,
      vrMemberLeft,
    ])

    await expect(replacementNotice).resolves.toMatchObject({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
      replacedBySocketId: secondConsole.id,
    })
    expect(secondConsole.connected).toBe(true)
    expect(firstConsole.connected).toBe(false)
    expect(vrSocket.connected).toBe(true)

    const deviceStatus = await new Promise<{ status: string }>((resolve) => {
      vrSocket.emit(
        CONNECTION_EVENT.DEVICE_STATUS,
        undefined,
        (response: { status: string }) => resolve(response),
      )
    })
    expect(deviceStatus.status).toBe('active')
  })

  it('keeps the room complete for the VR after console replacement', async () => {
    const roomCode = 'console-replacement-complete-room'
    const vrSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })
    const firstConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(vrSocket),
      waitForEvent(vrSocket, ROOM_EVENT.RoomJoined),
      waitForConnect(firstConsole),
      waitForEvent(firstConsole, ROOM_EVENT.RoomJoined),
      waitForEvent(vrSocket, ROOM_EVENT.RoomComplete),
    ])

    const secondConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(secondConsole),
      waitForEvent(firstConsole, ROOM_EVENT.ReplacementNotice),
      waitForEvent(secondConsole, ROOM_EVENT.RoomJoined),
      waitForDisconnect(firstConsole),
    ])

    const deviceStatus = await new Promise<{ status: string }>((resolve) => {
      vrSocket.emit(
        CONNECTION_EVENT.DEVICE_STATUS,
        undefined,
        (response: { status: string }) => resolve(response),
      )
    })

    expect(deviceStatus.status).toBe('active')
    await expectNoEvent(vrSocket, ROOM_EVENT.MemberLeft)
  })

  it('ignores a stale disconnect from the replaced console', async () => {
    const roomCode = 'console-stale-disconnect-room'
    const vrSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })
    const firstConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(vrSocket),
      waitForEvent(vrSocket, ROOM_EVENT.RoomJoined),
      waitForConnect(firstConsole),
      waitForEvent(firstConsole, ROOM_EVENT.RoomJoined),
      waitForEvent(vrSocket, ROOM_EVENT.RoomComplete),
    ])

    const secondConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(secondConsole),
      waitForEvent(firstConsole, ROOM_EVENT.ReplacementNotice),
      waitForEvent(secondConsole, ROOM_EVENT.RoomJoined),
      waitForDisconnect(firstConsole),
    ])

    const deviceStatus = await new Promise<{ status: string }>((resolve) => {
      vrSocket.emit(
        CONNECTION_EVENT.DEVICE_STATUS,
        undefined,
        (response: { status: string }) => resolve(response),
      )
    })

    expect(deviceStatus.status).toBe('active')
    expect(secondConsole.connected).toBe(true)
    await expectNoEvent(vrSocket, ROOM_EVENT.MemberLeft)
  })
})

describe('VR role peer replacement', () => {
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

  it('replaces the active VR peer instead of rejecting the room as full', async () => {
    const roomCode = 'vr-replacement-room'
    const consoleSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })
    const firstVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(consoleSocket),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomJoined),
      waitForConnect(firstVr),
      waitForEvent(firstVr, ROOM_EVENT.RoomJoined),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomComplete),
    ])

    const secondVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    const replacementNotice = waitForEvent<{
      roomCode: string
      role: string
      replacedBySocketId: string
    }>(firstVr, ROOM_EVENT.ReplacementNotice)
    const secondVrJoined = waitForEvent(secondVr, ROOM_EVENT.RoomJoined)
    const firstVrDisconnected = waitForDisconnect(firstVr)
    const consoleMemberLeft = expectNoEvent(
      consoleSocket,
      ROOM_EVENT.MemberLeft,
    )

    await Promise.all([
      waitForConnect(secondVr),
      replacementNotice,
      secondVrJoined,
      firstVrDisconnected,
      consoleMemberLeft,
    ])

    await expect(replacementNotice).resolves.toMatchObject({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
      replacedBySocketId: secondVr.id,
    })
    expect(secondVr.connected).toBe(true)
    expect(firstVr.connected).toBe(false)
    expect(consoleSocket.connected).toBe(true)

    const deviceStatus = await new Promise<{ status: string }>((resolve) => {
      consoleSocket.emit(
        CONNECTION_EVENT.DEVICE_STATUS,
        undefined,
        (response: { status: string }) => resolve(response),
      )
    })
    expect(deviceStatus.status).toBe('active')
  })

  it('keeps the room complete for the console after VR replacement', async () => {
    const roomCode = 'vr-replacement-complete-room'
    const consoleSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })
    const firstVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(consoleSocket),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomJoined),
      waitForConnect(firstVr),
      waitForEvent(firstVr, ROOM_EVENT.RoomJoined),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomComplete),
    ])

    const secondVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(secondVr),
      waitForEvent(firstVr, ROOM_EVENT.ReplacementNotice),
      waitForEvent(secondVr, ROOM_EVENT.RoomJoined),
      waitForDisconnect(firstVr),
    ])

    const deviceStatus = await new Promise<{ status: string }>((resolve) => {
      consoleSocket.emit(
        CONNECTION_EVENT.DEVICE_STATUS,
        undefined,
        (response: { status: string }) => resolve(response),
      )
    })

    expect(deviceStatus.status).toBe('active')
    await expectNoEvent(consoleSocket, ROOM_EVENT.MemberLeft)
  })
})

describe('relay protection from replaced peers', () => {
  let httpServer: HttpServer
  let port: number
  const clients: ClientSocket[] = []
  let originalDisconnect: ServerSocket['disconnect']
  const deferredServerDisconnects: ServerSocket[] = []

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
    deferredServerDisconnects.length = 0
    originalDisconnect = ServerSocket.prototype.disconnect
    ServerSocket.prototype.disconnect = function (
      this: ServerSocket,
      ...args: Parameters<ServerSocket['disconnect']>
    ) {
      deferredServerDisconnects.push(this)
      return this
    }
  })

  afterEach(() => {
    ServerSocket.prototype.disconnect = originalDisconnect
    for (const socket of deferredServerDisconnects) {
      originalDisconnect.call(socket, true)
    }
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

  it('blocks treatment, device, and casting relays from a replaced VR peer', async () => {
    const roomCode = 'vr-relay-block-room'
    const consoleSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })
    const firstVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(consoleSocket),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomJoined),
      waitForConnect(firstVr),
      waitForEvent(firstVr, ROOM_EVENT.RoomJoined),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomComplete),
    ])

    const secondVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(secondVr),
      waitForEvent(firstVr, ROOM_EVENT.ReplacementNotice),
      waitForEvent(secondVr, ROOM_EVENT.RoomJoined),
    ])

    const consoleProgramPause = expectNoEvent(
      consoleSocket,
      PROGRAM_EVENT.Pause,
    )
    const consoleDeviceId = expectNoEvent(
      consoleSocket,
      DEVICE_EVENT.SendDeviceId,
    )
    const consoleCastingOffer = expectNoEvent(
      consoleSocket,
      CASTING_EVENT.Offer,
    )

    firstVr.emit(PROGRAM_EVENT.Pause)
    firstVr.emit(DEVICE_EVENT.SendDeviceId, 'stale-device-id')
    firstVr.emit(CASTING_EVENT.Offer, { type: 'offer', sdp: 'stale-sdp' })

    await Promise.all([
      consoleProgramPause,
      consoleDeviceId,
      consoleCastingOffer,
    ])

    const relayedDeviceId = waitForEvent<string>(
      consoleSocket,
      DEVICE_EVENT.SendDeviceId,
    )
    secondVr.emit(DEVICE_EVENT.SendDeviceId, 'active-device-id')
    await expect(relayedDeviceId).resolves.toBe('active-device-id')
  })

  it('blocks relays from a replaced console peer', async () => {
    const roomCode = 'console-relay-block-room'
    const firstConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })
    const vrSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(firstConsole),
      waitForEvent(firstConsole, ROOM_EVENT.RoomJoined),
      waitForConnect(vrSocket),
      waitForEvent(vrSocket, ROOM_EVENT.RoomJoined),
      waitForEvent(firstConsole, ROOM_EVENT.RoomComplete),
    ])

    const secondConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(secondConsole),
      waitForEvent(firstConsole, ROOM_EVENT.ReplacementNotice),
      waitForEvent(secondConsole, ROOM_EVENT.RoomJoined),
    ])

    const vrProgramPause = expectNoEvent(vrSocket, PROGRAM_EVENT.Pause)
    firstConsole.emit(PROGRAM_EVENT.Pause)
    await vrProgramPause

    const relayedProgramPause = waitForEvent(vrSocket, PROGRAM_EVENT.Pause)
    secondConsole.emit(PROGRAM_EVENT.Pause)
    await relayedProgramPause
  })
})
