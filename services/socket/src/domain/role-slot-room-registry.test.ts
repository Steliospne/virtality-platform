import { describe, expect, it, beforeEach } from 'vitest'
import { ROOM_PEER_ROLE } from '@virtality/shared/types'
import {
  createRoleSlotRoomRegistry,
  type RoleSlotRoomRegistry,
} from './role-slot-room-registry'

describe('Role Slot Room Registry', () => {
  let registry: RoleSlotRoomRegistry

  beforeEach(() => {
    registry = createRoleSlotRoomRegistry()
  })

  it('joins an empty Role Slot and reports room completeness', () => {
    const outcome = registry.joinRoleSlot({
      roomCode: 'treatment-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    expect(outcome).toEqual({
      kind: 'role_slot_joined',
      roomCode: 'treatment-room',
      roomPeerRole: ROOM_PEER_ROLE.Console,
      activePeerSocketId: 'console-1',
      roomComplete: false,
    })
    expect(registry.getRoomSnapshot('treatment-room')).toMatchObject({
      roomCode: 'treatment-room',
      roomComplete: false,
      roomEmpty: false,
    })
  })

  it('marks the room complete once both Role Slots are occupied', () => {
    registry.joinRoleSlot({
      roomCode: 'complete-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    const outcome = registry.joinRoleSlot({
      roomCode: 'complete-room',
      peerSocketId: 'vr-1',
      roomPeerRole: ROOM_PEER_ROLE.Vr,
    })

    expect(outcome).toEqual({
      kind: 'role_slot_joined',
      roomCode: 'complete-room',
      roomPeerRole: ROOM_PEER_ROLE.Vr,
      activePeerSocketId: 'vr-1',
      roomComplete: true,
    })
    expect(registry.getDeviceStatus('complete-room')).toBe('active')
  })

  it('returns Role Peer Replacement when joining an occupied Role Slot', () => {
    registry.joinRoleSlot({
      roomCode: 'replacement-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })
    registry.joinRoleSlot({
      roomCode: 'replacement-room',
      peerSocketId: 'vr-1',
      roomPeerRole: ROOM_PEER_ROLE.Vr,
    })

    const outcome = registry.joinRoleSlot({
      roomCode: 'replacement-room',
      peerSocketId: 'console-2',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    expect(outcome).toEqual({
      kind: 'role_peer_replaced',
      roomCode: 'replacement-room',
      roomPeerRole: ROOM_PEER_ROLE.Console,
      replacedPeerSocketId: 'console-1',
      activePeerSocketId: 'console-2',
      roomComplete: true,
    })
  })

  it('clears only the departing Active Role Peer slot', () => {
    registry.joinRoleSlot({
      roomCode: 'departure-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })
    registry.joinRoleSlot({
      roomCode: 'departure-room',
      peerSocketId: 'vr-1',
      roomPeerRole: ROOM_PEER_ROLE.Vr,
    })

    const outcome = registry.disconnectRolePeer({
      roomCode: 'departure-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    expect(outcome).toEqual({
      kind: 'role_slot_cleared',
      roomCode: 'departure-room',
      roomPeerRole: ROOM_PEER_ROLE.Console,
      departedPeerSocketId: 'console-1',
      roomComplete: false,
    })
    expect(registry.hasRoom('departure-room')).toBe(true)
    expect(registry.getDeviceStatus('departure-room')).toBe('inactive')
  })

  it('deletes the room once both Role Slots are empty', () => {
    registry.joinRoleSlot({
      roomCode: 'empty-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    registry.disconnectRolePeer({
      roomCode: 'empty-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    expect(registry.hasRoom('empty-room')).toBe(false)
    expect(registry.getRoomSnapshot('empty-room')).toBeNull()
  })

  it('ignores stale disconnects from replaced Active Role Peers', () => {
    registry.joinRoleSlot({
      roomCode: 'stale-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })
    registry.joinRoleSlot({
      roomCode: 'stale-room',
      peerSocketId: 'vr-1',
      roomPeerRole: ROOM_PEER_ROLE.Vr,
    })
    registry.joinRoleSlot({
      roomCode: 'stale-room',
      peerSocketId: 'console-2',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    const outcome = registry.disconnectRolePeer({
      roomCode: 'stale-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    expect(outcome).toEqual({
      kind: 'stale_disconnect_ignored',
      roomCode: 'stale-room',
      roomPeerRole: ROOM_PEER_ROLE.Console,
      peerSocketId: 'console-1',
      activePeerSocketId: 'console-2',
    })
    expect(registry.getDeviceStatus('stale-room')).toBe('active')
  })

  it('authorizes relay only for the current Active Role Peer', () => {
    registry.joinRoleSlot({
      roomCode: 'relay-room',
      peerSocketId: 'console-1',
      roomPeerRole: ROOM_PEER_ROLE.Console,
    })

    expect(
      registry.authorizeRelay({
        roomCode: 'relay-room',
        peerSocketId: 'console-1',
        roomPeerRole: ROOM_PEER_ROLE.Console,
      }),
    ).toEqual({
      kind: 'relay_authorized',
      activePeerSocketId: 'console-1',
    })

    expect(
      registry.authorizeRelay({
        roomCode: 'relay-room',
        peerSocketId: 'console-stale',
        roomPeerRole: ROOM_PEER_ROLE.Console,
      }),
    ).toEqual({
      kind: 'relay_blocked',
      reason: 'not_active_role_peer',
      activePeerSocketId: 'console-1',
    })
  })
})
