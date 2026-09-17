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
  PROGRAM_EVENT,
  ROOM_EVENT,
  ROOM_PEER_ROLE,
  type ProgramStartPayload,
} from '@virtality/shared/types'
import { createRoleSlotRoomRegistry } from '../domain/role-slot-room-registry'
import { createServerDeviceController } from './server-device-controller'
import { createSocketTestHarness, waitForEvent } from './socket-test-helpers'

describe('coach socket contract', () => {
  const registry = createRoleSlotRoomRegistry()
  const controller = createServerDeviceController({ registry })
  const harness = createSocketTestHarness(controller.connectionHandler)
  beforeAll(() => harness.start())
  afterAll(() => harness.stop())
  beforeEach(() => registry.reset())
  afterEach(() => harness.disconnectClients())

  it.each([true, false])(
    'relays coachEnabled=%s at start and as a live boolean',
    async (coachEnabled) => {
      const roomCode = `coach-${coachEnabled}`
      const consoleSocket = harness.connectClient({
        roomCode,
        role: ROOM_PEER_ROLE.Console,
      })
      const consoleJoined = waitForEvent(consoleSocket, ROOM_EVENT.RoomJoined)
      const vrSocket = harness.connectClient({
        roomCode,
        role: ROOM_PEER_ROLE.Vr,
      })
      await Promise.all([
        consoleJoined,
        waitForEvent(vrSocket, ROOM_EVENT.RoomJoined),
      ])

      const payload: ProgramStartPayload = {
        exerciseData: [
          {
            id: 'exercise',
            sets: 2,
            reps: 4,
            restTime: 3,
            holdTime: 1,
            speed: 1,
          },
        ],
        settings: {
          avatarId: '1',
          mapId: '2',
          sessionNumber: 3,
          language: 'en',
          coachEnabled,
        },
      }
      const start = waitForEvent(vrSocket, PROGRAM_EVENT.Start)
      consoleSocket.emit(PROGRAM_EVENT.Start, payload)
      await expect(start).resolves.toEqual(payload)

      // Capture every argument: Unity expects exactly one raw boolean.
      const live = new Promise<unknown[]>((resolve) => {
        vrSocket.once('onToggleCoach', (...args: unknown[]) => resolve(args))
      })
      consoleSocket.emit(PROGRAM_EVENT.ToggleCoach, coachEnabled)
      await expect(live).resolves.toEqual([coachEnabled])
    },
  )
})
