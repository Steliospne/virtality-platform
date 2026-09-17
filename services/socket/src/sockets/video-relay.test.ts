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
  ROOM_EVENT,
  ROOM_PEER_ROLE,
  VIDEO_EVENT,
  VIDEO_RELAY,
} from '@virtality/shared/types'
import { createRoleSlotRoomRegistry } from '../domain/role-slot-room-registry'
import { createServerDeviceController } from './server-device-controller'
import {
  createSocketTestHarness,
  expectNoEvent,
  waitForConnect,
  waitForEvent,
} from './socket-test-helpers'

const samplePayload = { videoId: 'video-relay-sample' }

const payloadRelayEntries = Object.entries(VIDEO_RELAY).filter(
  ([, entry]) => entry.payload,
)
const noPayloadRelayEntries = Object.entries(VIDEO_RELAY).filter(
  ([, entry]) => !entry.payload,
)

describe('immersive video relay', () => {
  const registry = createRoleSlotRoomRegistry()
  const controller = createServerDeviceController({ registry })
  const harness = createSocketTestHarness(controller.connectionHandler)

  beforeAll(() => harness.start())
  afterAll(() => harness.stop())

  beforeEach(() => {
    registry.reset()
  })

  afterEach(() => harness.disconnectClients())

  const connectClient = harness.connectClient.bind(harness)

  async function connectPairedRoom(roomCode: string) {
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

  it.each(payloadRelayEntries)(
    'relays %s with the same payload from console to VR and back',
    async (_key, entry) => {
      const { consoleSocket, vrSocket } = await connectPairedRoom(
        `video-payload-${entry.name}`,
      )

      const vrReceived = waitForEvent<typeof samplePayload>(
        vrSocket,
        entry.name,
      )
      consoleSocket.emit(entry.name, samplePayload)
      await expect(vrReceived).resolves.toEqual(samplePayload)

      const consoleReceived = waitForEvent<typeof samplePayload>(
        consoleSocket,
        entry.name,
      )
      vrSocket.emit(entry.name, samplePayload)
      await expect(consoleReceived).resolves.toEqual(samplePayload)
    },
  )

  it.each(noPayloadRelayEntries)(
    'relays %s with no payload from console to VR and back',
    async (_key, entry) => {
      const { consoleSocket, vrSocket } = await connectPairedRoom(
        `video-no-payload-${entry.name}`,
      )

      const vrReceived = waitForEvent<unknown>(vrSocket, entry.name)
      consoleSocket.emit(entry.name)
      await expect(vrReceived).resolves.toBeNull()

      const consoleReceived = waitForEvent<unknown>(consoleSocket, entry.name)
      vrSocket.emit(entry.name)
      await expect(consoleReceived).resolves.toBeNull()
    },
  )

  it('delivers a bare videoId as Socket.IO argument 0, not an array', async () => {
    const { consoleSocket, vrSocket } = await connectPairedRoom('video-args')

    const rawPacket = new Promise<string>((resolve) => {
      vrSocket.io.engine.once('data', (data) => resolve(String(data)))
    })
    const vrArgs = new Promise<unknown[]>((resolve) => {
      vrSocket.once(VIDEO_EVENT.Play, (...args: unknown[]) => resolve(args))
    })

    consoleSocket.emit(VIDEO_EVENT.Play, 'video-args-sample')

    await expect(rawPacket).resolves.toBe(
      `2${JSON.stringify([VIDEO_EVENT.Play, 'video-args-sample'])}`,
    )
    await expect(vrArgs).resolves.toEqual(['video-args-sample'])
  })

  it('does not deliver videoDownloadStart to a socket in a different room', async () => {
    const { consoleSocket } = await connectPairedRoom('video-same-room')
    const { vrSocket: otherRoomVr } =
      await connectPairedRoom('video-other-room')

    const leaked = expectNoEvent(otherRoomVr, VIDEO_EVENT.DownloadStart)

    consoleSocket.emit(VIDEO_EVENT.DownloadStart, samplePayload)
    await leaked
  })
})
