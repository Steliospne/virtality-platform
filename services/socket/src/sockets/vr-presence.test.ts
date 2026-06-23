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
  type VrPresenceResponse,
} from '@virtality/shared/types'
import {
  connectionHandler,
  hasActiveRoomForTests,
  resetActiveRoomsForTests,
} from './device-event-controller'
import {
  createSocketTestHarness,
  expectNoEvent,
  waitForConnect,
  waitForEvent,
} from './socket-test-helpers'

async function queryVrPresence(
  socket: ReturnType<
    ReturnType<typeof createSocketTestHarness>['connectClient']
  >,
  roomCodes: string[],
): Promise<VrPresenceResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for VR presence response'))
    }, 3000)

    socket.emit(
      CONNECTION_EVENT.VR_PRESENCE,
      { roomCodes },
      (response: VrPresenceResponse) => {
        clearTimeout(timer)
        resolve(response)
      },
    )
  })
}

describe('read-only VR presence', () => {
  const harness = createSocketTestHarness(connectionHandler)

  beforeAll(() => harness.start())
  afterAll(() => harness.stop())

  beforeEach(() => {
    resetActiveRoomsForTests()
  })

  afterEach(() => harness.disconnectClients())

  const connectClient = harness.connectClient.bind(harness)

  it('answers presence queries without joining a device room', async () => {
    const presenceSocket = connectClient({ mode: 'presence' })
    await waitForConnect(presenceSocket)

    const roomJoined = expectNoRoomJoined(presenceSocket)
    const response = await queryVrPresence(presenceSocket, ['unused-room'])

    await roomJoined
    expect(response).toEqual({ presence: { 'unused-room': false } })
    expect(hasActiveRoomForTests('unused-room')).toBe(false)
  })

  it('reports VR presence for active, inactive, and missing rooms', async () => {
    const roomCode = 'presence-active-room'
    const vrSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })
    const consoleSocket = connectClient({
      roomCode: 'console-only-room',
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(vrSocket),
      waitForEvent(vrSocket, ROOM_EVENT.RoomJoined),
      waitForConnect(consoleSocket),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomJoined),
    ])

    const presenceSocket = connectClient({ mode: 'presence' })
    await waitForConnect(presenceSocket)

    const response = await queryVrPresence(presenceSocket, [
      roomCode,
      'console-only-room',
      'missing-room',
    ])

    expect(response).toEqual({
      presence: {
        [roomCode]: true,
        'console-only-room': false,
        'missing-room': false,
      },
    })
  })

  it('does not occupy or replace console Role Slots during presence checks', async () => {
    const roomCode = 'presence-console-room'
    const consoleSocket = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Console,
    })

    await Promise.all([
      waitForConnect(consoleSocket),
      waitForEvent(consoleSocket, ROOM_EVENT.RoomJoined),
    ])

    const presenceSocket = connectClient({ mode: 'presence' })
    await waitForConnect(presenceSocket)

    const response = await queryVrPresence(presenceSocket, [roomCode])

    expect(response).toEqual({ presence: { [roomCode]: false } })
    expect(consoleSocket.connected).toBe(true)
    await expectNoEvent(consoleSocket, ROOM_EVENT.ReplacementNotice)
    await expectNoEvent(consoleSocket, ROOM_EVENT.MemberLeft)
  })

  it('reflects VR replacement without mutating room membership from presence clients', async () => {
    const roomCode = 'presence-replacement-room'
    const firstVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(firstVr),
      waitForEvent(firstVr, ROOM_EVENT.RoomJoined),
    ])

    const presenceSocket = connectClient({ mode: 'presence' })
    await waitForConnect(presenceSocket)

    const beforeReplacement = await queryVrPresence(presenceSocket, [roomCode])
    expect(beforeReplacement).toEqual({ presence: { [roomCode]: true } })

    const secondVr = connectClient({
      roomCode,
      role: ROOM_PEER_ROLE.Vr,
    })

    await Promise.all([
      waitForConnect(secondVr),
      waitForEvent(firstVr, ROOM_EVENT.ReplacementNotice),
      waitForEvent(secondVr, ROOM_EVENT.RoomJoined),
    ])

    const afterReplacement = await queryVrPresence(presenceSocket, [roomCode])
    expect(afterReplacement).toEqual({ presence: { [roomCode]: true } })
    expect(hasActiveRoomForTests(roomCode)).toBe(true)
  })
})

function expectNoRoomJoined(
  socket: ReturnType<
    ReturnType<typeof createSocketTestHarness>['connectClient']
  >,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(ROOM_EVENT.RoomJoined, onRoomJoined)
      resolve()
    }, 300)

    const onRoomJoined = () => {
      clearTimeout(timer)
      reject(new Error(`Unexpected event "${ROOM_EVENT.RoomJoined}" received`))
    }

    socket.on(ROOM_EVENT.RoomJoined, onRoomJoined)
  })
}
