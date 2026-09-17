import {
  VIDEO_EVENT,
  type RelayEventMap,
  type RoomPeerRole,
} from '@virtality/shared/types'
import type { RoleSlotRoomRegistry } from '../domain/role-slot-room-registry'

// ── Relay table ────────────────────────────────────────────────────────────

type RelayLogLevel = 'info' | 'debug'

type RelayTableEntry = {
  /** `true` = forward the payload arg to the other room peer (ADR 0009 §3). */
  payload: boolean
  logLevel: RelayLogLevel
}

/** Every relayed wire event, merged across the registered Relay Families. */
export type RelayTable = ReadonlyMap<string, RelayTableEntry>

/**
 * Periodic events a headset emits many times a second while a download or
 * playback runs. Logging each at `info` floods Grafana; keep them at `debug`.
 */
const DEBUG_LEVEL_RELAY_EVENTS: ReadonlySet<string> = new Set([
  VIDEO_EVENT.DownloadProgress,
  VIDEO_EVENT.PlaybackProgress,
])

export function buildRelayTable(
  families: readonly RelayEventMap[],
): RelayTable {
  const table = new Map<string, RelayTableEntry>()

  for (const family of families) {
    for (const key in family) {
      const entry = family[key]
      if (table.has(entry.name)) {
        throw new Error(`Duplicate relay event "${entry.name}" across families`)
      }
      table.set(entry.name, {
        payload: entry.payload,
        logLevel: DEBUG_LEVEL_RELAY_EVENTS.has(entry.name) ? 'debug' : 'info',
      })
    }
  }

  return table
}

// ── Relay ──────────────────────────────────────────────────────────────────

export type RelayPeer = {
  socketId: string
  roomCode: string
  roomPeerRole: RoomPeerRole | undefined
}

export type RelayOutcome =
  | {
      kind: 'forwarded'
      event: string
      payload: unknown
      logLevel: RelayLogLevel
    }
  | {
      kind: 'blocked'
      reason: 'missing_room_or_role' | 'room_not_found' | 'not_active_role_peer'
      activePeerSocketId: string | null
    }
  | { kind: 'not_relayed'; event: string }

/**
 * Decides what happens to one inbound event. It performs no I/O: the caller
 * emits and logs from the outcome, the same split as the Role Slot Room
 * Registry.
 */
export type Relay = {
  forward(peer: RelayPeer, event: string, payload?: unknown): RelayOutcome
}

export function createRelay(options: {
  table: RelayTable
  registry: RoleSlotRoomRegistry
}): Relay {
  const { table, registry } = options

  return {
    forward(peer, event, payload) {
      const entry = table.get(event)
      if (!entry) {
        return { kind: 'not_relayed', event }
      }

      const { socketId, roomCode, roomPeerRole } = peer
      if (!roomPeerRole) {
        return {
          kind: 'blocked',
          reason: 'missing_room_or_role',
          activePeerSocketId: null,
        }
      }

      const authorization = registry.authorizeRelay({
        roomCode,
        peerSocketId: socketId,
        roomPeerRole,
      })
      if (authorization.kind === 'relay_blocked') {
        return {
          kind: 'blocked',
          reason: authorization.reason,
          activePeerSocketId: authorization.activePeerSocketId,
        }
      }

      return {
        kind: 'forwarded',
        event,
        payload: entry.payload ? payload : undefined,
        logLevel: entry.logLevel,
      }
    },
  }
}
