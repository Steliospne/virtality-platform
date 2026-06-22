import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { ROOM_EVENT, ROOM_PEER_ROLE } from '@virtality/shared/types'
import {
  connectionHandler,
  hasActiveRoomForTests,
  resetActiveRoomsForTests,
} from './device-event-controller'
import {
  createSocketTestHarness,
  waitForConnect,
  waitForEvent,
} from './socket-test-helpers'

describe('device event controller connection handler', () => {
  const harness = createSocketTestHarness(connectionHandler)

  beforeAll(() => harness.start())
  afterAll(() => harness.stop())

  beforeEach(() => {
    resetActiveRoomsForTests()
  })

  afterEach(() => harness.disconnectClients())

  const connectClient = harness.connectClient.bind(harness)

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
