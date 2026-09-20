import type { AppMeter } from '@virtality/shared/observability'
import type { RoomPeerRole } from '@virtality/shared/types'

import type { RoleSlotRoomRegistry } from '../domain/role-slot-room-registry'

type RelayOutcomeName =
  | 'forwarded'
  | 'blocked'
  | 'stale_peer_blocked'
  | 'unknown_event'

export type SocketMetrics = {
  roomEvent(
    event: string,
    attributes?: { role?: RoomPeerRole; reason?: string },
  ): void
  relay(eventName: string, outcome: RelayOutcomeName): void
  connection(outcome: 'open' | 'closed' | 'rejected', reason?: string): void
}

// Counters mirror the socket.* log events so a PromQL rate() answers what a
// count_over_time() over logs answers today, without depending on log level
// or volume. Labels stay to enums (event, role, reason, outcome, eventName);
// roomCode and socketId never become labels.
export function createSocketMetrics(
  meter: AppMeter,
  registry: RoleSlotRoomRegistry,
): SocketMetrics {
  meter
    .createObservableGauge('socket.rooms.active', {
      description: 'Rooms currently held by the registry',
      unit: '{room}',
    })
    .addCallback((result) => {
      result.observe(registry.getActiveRoomCount())
    })

  const roomEvents = meter.createCounter('socket.room.events', {
    description: 'Room lifecycle events (socket.room.* log events)',
    unit: '{event}',
  })
  const relayMessages = meter.createCounter('socket.relay.messages', {
    description: 'Messages received for relay, by outcome',
    unit: '{message}',
  })
  const connections = meter.createCounter('socket.connections', {
    description: 'Socket connections by outcome',
    unit: '{connection}',
  })

  return {
    roomEvent(event, attributes = {}) {
      roomEvents.add(1, {
        event,
        ...(attributes.role ? { role: attributes.role } : {}),
        ...(attributes.reason ? { reason: attributes.reason } : {}),
      })
    },
    relay(eventName, outcome) {
      relayMessages.add(1, { eventName, outcome })
    },
    connection(outcome, reason) {
      connections.add(1, {
        outcome,
        ...(reason ? { reason } : {}),
      })
    },
  }
}
