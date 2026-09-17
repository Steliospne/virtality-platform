import { beforeEach, describe, expect, it } from 'vitest'
import {
  CASTING_RELAY,
  PROGRAM_EVENT,
  PROGRAM_RELAY,
  ROOM_PEER_ROLE,
  VIDEO_EVENT,
  VIDEO_RELAY,
} from '@virtality/shared/types'
import {
  createRoleSlotRoomRegistry,
  type RoleSlotRoomRegistry,
} from '../domain/role-slot-room-registry'
import {
  buildRelayTable,
  createRelay,
  type Relay,
  type RelayPeer,
} from './relay'

const ROOM = 'room-relay'
const CONSOLE_ID = 'console-1'
const VR_ID = 'vr-1'

function consolePeer(overrides: Partial<RelayPeer> = {}): RelayPeer {
  return {
    socketId: CONSOLE_ID,
    roomCode: ROOM,
    roomPeerRole: ROOM_PEER_ROLE.Console,
    ...overrides,
  }
}

describe('buildRelayTable', () => {
  const table = buildRelayTable([PROGRAM_RELAY, CASTING_RELAY, VIDEO_RELAY])

  it('keys every family entry by wire name', () => {
    const expectedSize =
      Object.keys(PROGRAM_RELAY).length +
      Object.keys(CASTING_RELAY).length +
      Object.keys(VIDEO_RELAY).length
    expect(table.size).toBe(expectedSize)
    expect(table.get(PROGRAM_EVENT.Start)).toEqual({
      payload: true,
      logLevel: 'info',
    })
    expect(table.get(PROGRAM_EVENT.StartAck)).toEqual({
      payload: false,
      logLevel: 'info',
    })
  })

  it('folds the high-volume rule into logLevel', () => {
    expect(table.get(VIDEO_EVENT.DownloadProgress)?.logLevel).toBe('debug')
    expect(table.get(VIDEO_EVENT.PlaybackProgress)?.logLevel).toBe('debug')
    expect(table.get(VIDEO_EVENT.DownloadStart)?.logLevel).toBe('info')
  })

  it('rejects two families that claim the same wire name', () => {
    expect(() => buildRelayTable([PROGRAM_RELAY, PROGRAM_RELAY])).toThrow(
      /duplicate/i,
    )
  })
})

describe('Relay.forward', () => {
  let registry: RoleSlotRoomRegistry
  let relay: Relay

  beforeEach(() => {
    registry = createRoleSlotRoomRegistry()
    relay = createRelay({
      table: buildRelayTable([PROGRAM_RELAY, VIDEO_RELAY]),
      registry,
    })
    registry.joinRoleSlot({
      roomCode: ROOM,
      peerSocketId: CONSOLE_ID,
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })
    registry.joinRoleSlot({
      roomCode: ROOM,
      peerSocketId: VR_ID,
      roomPeerRole: ROOM_PEER_ROLE.Vr,
    })
  })

  it('forwards a known event from the active role peer', () => {
    const payload = { programId: 'p1' }
    expect(relay.forward(consolePeer(), PROGRAM_EVENT.Start, payload)).toEqual({
      kind: 'forwarded',
      event: PROGRAM_EVENT.Start,
      payload,
      logLevel: 'info',
    })
  })

  it('strips the payload when the table entry says payload: false', () => {
    expect(
      relay.forward(consolePeer(), PROGRAM_EVENT.Pause, { ignored: true }),
    ).toEqual({
      kind: 'forwarded',
      event: PROGRAM_EVENT.Pause,
      payload: undefined,
      logLevel: 'info',
    })
  })

  it('marks high-volume events as debug', () => {
    const outcome = relay.forward(
      { socketId: VR_ID, roomCode: ROOM, roomPeerRole: ROOM_PEER_ROLE.Vr },
      VIDEO_EVENT.DownloadProgress,
      '{"videoId":"v1"}',
    )
    expect(outcome).toEqual({
      kind: 'forwarded',
      event: VIDEO_EVENT.DownloadProgress,
      payload: '{"videoId":"v1"}',
      logLevel: 'debug',
    })
  })

  it('blocks a peer with no role before touching the registry', () => {
    expect(
      relay.forward(
        consolePeer({ roomPeerRole: undefined }),
        PROGRAM_EVENT.Start,
        {},
      ),
    ).toEqual({
      kind: 'blocked',
      reason: 'missing_room_or_role',
      activePeerSocketId: null,
    })
  })

  it('blocks a stale peer and names the active one', () => {
    registry.joinRoleSlot({
      roomCode: ROOM,
      peerSocketId: 'console-2',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })
    expect(relay.forward(consolePeer(), PROGRAM_EVENT.Start, {})).toEqual({
      kind: 'blocked',
      reason: 'not_active_role_peer',
      activePeerSocketId: 'console-2',
    })
  })

  it('blocks when the room is gone', () => {
    registry.reset()
    expect(relay.forward(consolePeer(), PROGRAM_EVENT.Start, {})).toEqual({
      kind: 'blocked',
      reason: 'room_not_found',
      activePeerSocketId: null,
    })
  })

  it('reports an event outside the table as not_relayed', () => {
    expect(relay.forward(consolePeer(), 'gameLoad', {})).toEqual({
      kind: 'not_relayed',
      event: 'gameLoad',
    })
  })

  it('checks the table before authorization', () => {
    expect(
      relay.forward(consolePeer({ roomPeerRole: undefined }), 'gameLoad'),
    ).toEqual({ kind: 'not_relayed', event: 'gameLoad' })
  })
})
