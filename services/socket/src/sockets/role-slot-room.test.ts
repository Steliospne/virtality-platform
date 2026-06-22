import type { Socket as ClientSocket } from 'socket.io-client'
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
  hasActiveRoomForTests,
  resetActiveRoomsForTests,
} from '../sockets/device-event-controller'
import {
  createSocketTestHarness,
  expectNoEvent,
  waitForConnect,
  waitForDisconnect,
  waitForEvent,
} from './socket-test-helpers'

async function waitForRoomRemoval(
  roomCode: string,
  timeoutMs = 3000,
): Promise<void> {
  const start = Date.now()

  while (hasActiveRoomForTests(roomCode)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for room "${roomCode}" to be removed`)
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

describe('role-slot room entry', () => {
  const harness = createSocketTestHarness(connectionHandler)

  beforeAll(() => harness.start())
  afterAll(() => harness.stop())

  beforeEach(() => {
    resetActiveRoomsForTests()
  })

  afterEach(() => harness.disconnectClients())

  const connectClient = harness.connectClient.bind(harness)

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
  const harness = createSocketTestHarness(connectionHandler)

  beforeAll(() => harness.start())
  afterAll(() => harness.stop())

  beforeEach(() => {
    resetActiveRoomsForTests()
  })

  afterEach(() => harness.disconnectClients())

  const connectClient = harness.connectClient.bind(harness)

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
  const harness = createSocketTestHarness(connectionHandler)

  beforeAll(() => harness.start())
  afterAll(() => harness.stop())

  beforeEach(() => {
    resetActiveRoomsForTests()
  })

  afterEach(() => harness.disconnectClients())

  const connectClient = harness.connectClient.bind(harness)

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
  const harness = createSocketTestHarness(connectionHandler)
  let originalDisconnect: ServerSocket['disconnect']
  const deferredServerDisconnects: ServerSocket[] = []

  beforeAll(() => harness.start())
  afterAll(() => harness.stop())

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
    harness.disconnectClients()
  })

  const connectClient = harness.connectClient.bind(harness)

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

describe('active role peer departure', () => {
  const harness = createSocketTestHarness(connectionHandler)

  beforeAll(() => harness.start())
  afterAll(() => harness.stop())

  beforeEach(() => {
    resetActiveRoomsForTests()
  })

  afterEach(() => harness.disconnectClients())

  const connectClient = harness.connectClient.bind(harness)

  async function queryDeviceStatus(
    socket: ClientSocket,
  ): Promise<{ status: string }> {
    return new Promise((resolve) => {
      socket.emit(
        CONNECTION_EVENT.DEVICE_STATUS,
        undefined,
        (response: { status: string }) => resolve(response),
      )
    })
  }

  async function joinCompleteRoom(roomCode: string) {
    const consoleSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })
    const vrSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(consoleSocket),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomJoined),
      waitForConnect(vrSocket),
      waitForEvent(vrSocket, ROOM_EVENT.RoomJoined),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomComplete),
    ])

    return { consoleSocket, vrSocket }
  }

  it('clears only the console role slot when the active console disconnects', async () => {
    const roomCode = 'console-departure-room'
    const { consoleSocket, vrSocket } = await joinCompleteRoom(roomCode)
    const consoleSocketId = consoleSocket.id!

    const memberLeft = waitForEvent<{ memberId: string }>(
      vrSocket,
      ROOM_EVENT.MemberLeft,
    )
    consoleSocket.disconnect()
    const [, leftPayload] = await Promise.all([
      waitForDisconnect(consoleSocket),
      memberLeft,
    ])

    expect(leftPayload).toMatchObject({ memberId: consoleSocketId })
    expect(vrSocket.connected).toBe(true)
    expect(hasActiveRoomForTests(roomCode)).toBe(true)

    const replacementConsole = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })
    const roomComplete = waitForEvent(vrSocket, ROOM_EVENT.RoomComplete)

    await Promise.all([
      waitForConnect(replacementConsole),
      waitForEvent(replacementConsole, ROOM_EVENT.RoomJoined),
      roomComplete,
    ])

    expect(replacementConsole.connected).toBe(true)
    await expectNoEvent(replacementConsole, ROOM_EVENT.ReplacementNotice)
  })

  it('clears only the VR role slot when the active VR disconnects', async () => {
    const roomCode = 'vr-departure-room'
    const { consoleSocket, vrSocket } = await joinCompleteRoom(roomCode)
    const vrSocketId = vrSocket.id!

    const memberLeft = waitForEvent<{ memberId: string }>(
      consoleSocket,
      ROOM_EVENT.MemberLeft,
    )
    vrSocket.disconnect()
    const [, leftPayload] = await Promise.all([
      waitForDisconnect(vrSocket),
      memberLeft,
    ])

    expect(leftPayload).toMatchObject({ memberId: vrSocketId })
    expect(consoleSocket.connected).toBe(true)
    expect(hasActiveRoomForTests(roomCode)).toBe(true)

    const replacementVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })
    const roomComplete = waitForEvent(consoleSocket, ROOM_EVENT.RoomComplete)

    await Promise.all([
      waitForConnect(replacementVr),
      waitForEvent(replacementVr, ROOM_EVENT.RoomJoined),
      roomComplete,
    ])

    expect(replacementVr.connected).toBe(true)
    await expectNoEvent(replacementVr, ROOM_EVENT.ReplacementNotice)
  })

  it('marks the room incomplete after an active role peer leaves normally', async () => {
    const roomCode = 'room-incomplete-room'
    const { consoleSocket, vrSocket } = await joinCompleteRoom(roomCode)

    expect((await queryDeviceStatus(consoleSocket)).status).toBe('active')
    expect((await queryDeviceStatus(vrSocket)).status).toBe('active')

    const memberLeft = waitForEvent(consoleSocket, ROOM_EVENT.MemberLeft)
    vrSocket.disconnect()
    await Promise.all([waitForDisconnect(vrSocket), memberLeft])

    expect((await queryDeviceStatus(consoleSocket)).status).toBe('inactive')
  })

  it('deletes the room once neither active role slot is occupied', async () => {
    const roomCode = 'empty-room-cleanup'
    const { consoleSocket, vrSocket } = await joinCompleteRoom(roomCode)

    expect(hasActiveRoomForTests(roomCode)).toBe(true)

    const vrMemberLeft = waitForEvent(vrSocket, ROOM_EVENT.MemberLeft)
    consoleSocket.disconnect()
    await Promise.all([waitForDisconnect(consoleSocket), vrMemberLeft])

    expect(hasActiveRoomForTests(roomCode)).toBe(true)

    vrSocket.disconnect()
    await waitForDisconnect(vrSocket)
    await waitForRoomRemoval(roomCode)

    expect(hasActiveRoomForTests(roomCode)).toBe(false)
  })

  it('ignores a stale disconnect from the replaced VR peer', async () => {
    const roomCode = 'vr-stale-disconnect-room'
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

    expect((await queryDeviceStatus(consoleSocket)).status).toBe('active')
    expect(secondVr.connected).toBe(true)
    await expectNoEvent(consoleSocket, ROOM_EVENT.MemberLeft)
  })

  it('signals room complete only when both role slots are occupied', async () => {
    const roomCode = 'role-slot-complete-room'
    const consoleSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(consoleSocket),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomJoined),
    ])

    expect((await queryDeviceStatus(consoleSocket)).status).toBe('inactive')
    await expectNoEvent(consoleSocket, ROOM_EVENT.RoomComplete)

    const vrSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })
    const roomComplete = waitForEvent(consoleSocket, ROOM_EVENT.RoomComplete)

    await Promise.all([
      waitForConnect(vrSocket),
      waitForEvent(vrSocket, ROOM_EVENT.RoomJoined),
      roomComplete,
    ])

    expect((await queryDeviceStatus(consoleSocket)).status).toBe('active')
    expect((await queryDeviceStatus(vrSocket)).status).toBe('active')
  })
})
