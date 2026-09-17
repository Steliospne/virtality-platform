import { Socket } from 'socket.io'
import {
  PROGRAM_RELAY,
  CASTING_RELAY,
  DEVICE_RELAY,
  VIDEO_RELAY,
  VIDEO_EVENT,
  CONNECTION_EVENT,
  ROOM_EVENT,
  ROOM_PEER_ROLE,
  type RelayEventMap,
  type RoomPeerRole,
  type DeviceStatusResponse,
  type RoomJoinedPayload,
  type MemberJoinedPayload,
  type RoomCompletePayload,
  type MemberLeftPayload,
  type ReplacementNoticePayload,
  type VrPresenceRequest,
  type VrPresenceResponse,
  parseRoomPeerRole,
} from '@virtality/shared/types'
import { createAppLogger } from '@virtality/shared/observability'
import {
  EMPTY_ROLE_SLOT_PEER_LOG_CONTEXT,
  roleSlotPeerLogContext,
  type DisconnectRolePeerOutcome,
  type RelayBlockedOutcome,
  type RolePeerReplacedOutcome,
  type RoleSlotJoinedOutcome,
  type RoleSlotPeerLogContext,
  type RoleSlotRoomRegistry,
  type RoomEvictedOutcome,
} from '../domain/role-slot-room-registry'
import vrCommSim from './vrCommsTesting'

const logger = createAppLogger({
  serviceName: 'socket',
  defaultAttributes: {
    component: 'device-event-controller',
  },
})

type SocketWithRole = Socket & {
  data: {
    roomPeerRole?: RoomPeerRole
  }
}

export type ServerDeviceController = {
  connectionHandler(socket: Socket): void
  runStaleRoomCleanup(now?: number): RoomEvictedOutcome[]
  logRoomSnapshot(): void
}

export type ServerDeviceControllerOptions = {
  registry: RoleSlotRoomRegistry
  simulation?: boolean
}

// ── Stateless helpers ──────────────────────────────────────────────────────

function logRelayBlocked(
  authorization: RelayBlockedOutcome,
  context: {
    eventName: string
    roomCode: string
    socketId: string
    role: RoomPeerRole
  },
) {
  const payload = {
    eventName: context.eventName,
    roomCode: context.roomCode,
    socketId: context.socketId,
    role: context.role,
    reason: authorization.reason,
    activePeerSocketId: authorization.activePeerSocketId,
  }

  if (authorization.reason === 'room_not_found') {
    logger.warn('socket.relay.blocked', payload)
    return
  }

  logger.info('socket.relay.stale_peer_blocked', payload)
}

/**
 * Periodic events a headset emits many times a second while a download or
 * playback runs. Logging each at `info` floods Grafana; keep them at `debug`.
 */
const HIGH_VOLUME_RELAY_EVENTS: ReadonlySet<string> = new Set([
  VIDEO_EVENT.DownloadProgress,
  VIDEO_EVENT.PlaybackProgress,
])

function relayEmitLogLevel(eventName: string): 'info' | 'debug' {
  return HIGH_VOLUME_RELAY_EVENTS.has(eventName) ? 'debug' : 'info'
}

function rejectConnection(
  socket: Socket,
  reason: string,
  message: string,
  details: Record<string, unknown> = {},
) {
  logger.warn('socket.connection.rejected', {
    socketId: socket.id,
    reason,
    ...details,
  })
  socket.emit(CONNECTION_EVENT.ERROR, { message })
  socket.disconnect()
}

const ROLE_PEER_REPLACED_LOG_EVENT = {
  [ROOM_PEER_ROLE.Vr]: 'socket.room.vr_role_peer_replaced',
  [ROOM_PEER_ROLE.Console]: 'socket.room.console_role_peer_replaced',
} as const satisfies Record<RoomPeerRole, string>

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * One controller serves every room on its namespace. It owns no process-wide
 * state: the registry is passed in and timers are scheduled by the caller.
 */
export function createServerDeviceController(
  options: ServerDeviceControllerOptions,
): ServerDeviceController {
  const { registry } = options
  const simulation = options.simulation ?? false

  function getRoleSlotLogContext(roomCode: string): RoleSlotPeerLogContext {
    const snapshot = registry.getRoomSnapshot(roomCode)
    if (!snapshot) {
      return EMPTY_ROLE_SLOT_PEER_LOG_CONTEXT
    }

    return roleSlotPeerLogContext(snapshot.roleSlots)
  }

  // ── Relay registration ───────────────────────────────────────────────────

  function registerRelayEvents(
    eventMap: RelayEventMap,
    roomCode: string | string[],
    socket: SocketWithRole,
  ) {
    const resolvedRoomCode = Array.isArray(roomCode) ? roomCode[0] : roomCode

    for (const key in eventMap) {
      const entry = eventMap[key]
      logger.debug('registerRelayEvents', {
        role: socket.data.roomPeerRole ?? 'unknown',
        eventName: entry.name,
        roomCode: resolvedRoomCode,
        socketId: socket.id,
      })
      socket.on(entry.name, (payload: unknown) => {
        const roomPeerRole = socket.data.roomPeerRole

        if (!roomPeerRole) {
          logger.warn('socket.relay.blocked', {
            eventName: entry.name,
            roomCode: resolvedRoomCode,
            socketId: socket.id,
            reason: 'missing_room_or_role',
          })
          return
        }

        const authorization = registry.authorizeRelay({
          roomCode: resolvedRoomCode,
          peerSocketId: socket.id,
          roomPeerRole,
        })

        if (authorization.kind === 'relay_blocked') {
          logRelayBlocked(authorization, {
            eventName: entry.name,
            roomCode: resolvedRoomCode,
            socketId: socket.id,
            role: roomPeerRole,
          })
          return
        }

        logger[relayEmitLogLevel(entry.name)]('socket.relay.emit', {
          eventName: entry.name,
          role: roomPeerRole,
          roomCode: resolvedRoomCode,
          socketId: socket.id,
          hasPayload: payload !== undefined,
          // A JSON string and an object log alike; only the type tells them apart.
          payloadType: typeof payload,
          payload,
        })
        socket
          .to(resolvedRoomCode)
          .emit(entry.name, entry.payload ? payload : undefined)
      })
    }
  }

  // ── Room lifecycle ───────────────────────────────────────────────────────

  function emitRoomCompleteIfNeeded(
    socket: SocketWithRole,
    roomCode: string,
    roomPeerRole: RoomPeerRole,
    roomComplete: boolean,
  ) {
    if (!roomComplete) {
      return
    }

    socket.nsp.to(roomCode).emit(ROOM_EVENT.RoomComplete, {
      roomCode,
      timestamp: Date.now(),
    } satisfies RoomCompletePayload)
    logger.info('socket.room.complete', {
      roomCode,
      socketId: socket.id,
      role: roomPeerRole,
      ...getRoleSlotLogContext(roomCode),
    })
  }

  function handleDisconnectOutcome(
    socket: SocketWithRole,
    outcome: DisconnectRolePeerOutcome,
  ) {
    switch (outcome.kind) {
      case 'room_not_found':
        return
      case 'stale_disconnect_ignored':
        logger.info('socket.room.stale_disconnect_ignored', {
          roomCode: outcome.roomCode,
          socketId: outcome.peerSocketId,
          role: outcome.roomPeerRole,
          activePeerSocketId: outcome.activePeerSocketId,
        })
        return
      case 'room_deleted':
        logger.info('socket.room.deleted', {
          roomCode: outcome.roomCode,
        })
        return
      case 'role_slot_cleared':
        socket.to(outcome.roomCode).emit(ROOM_EVENT.MemberLeft, {
          memberId: outcome.departedPeerSocketId,
          timestamp: Date.now(),
        } satisfies MemberLeftPayload)
        logger.info('socket.room.role_slot_cleared', {
          roomCode: outcome.roomCode,
          socketId: outcome.departedPeerSocketId,
          role: outcome.roomPeerRole,
          ...getRoleSlotLogContext(outcome.roomCode),
        })
        return
    }
  }

  function registerRoomEvents(
    roomCode: string,
    socket: SocketWithRole,
    roomPeerRole: RoomPeerRole,
    options: { emitMemberJoined?: boolean; roomComplete?: boolean } = {},
  ) {
    const emitMemberJoined = options.emitMemberJoined ?? true
    const roomComplete =
      options.roomComplete ??
      registry.getRoomSnapshot(roomCode)?.roomComplete ??
      false

    socket.emit(ROOM_EVENT.RoomJoined, {
      roomCode,
      memberId: socket.id,
    } satisfies RoomJoinedPayload)

    if (emitMemberJoined) {
      socket.to(roomCode).emit(ROOM_EVENT.MemberJoined, {
        memberId: socket.id,
        timestamp: Date.now(),
      } satisfies MemberJoinedPayload)
    }

    emitRoomCompleteIfNeeded(socket, roomCode, roomPeerRole, roomComplete)

    socket.on(CONNECTION_EVENT.DISCONNECTION, () => {
      logger.info('socket.connection.closed', {
        roomCode,
        socketId: socket.id,
        role: roomPeerRole,
      })

      if (!registry.hasRoom(roomCode)) return

      const outcome = registry.disconnectRolePeer({
        roomCode,
        peerSocketId: socket.id,
        roomPeerRole,
      })
      handleDisconnectOutcome(socket, outcome)
    })
  }

  // ── Connection‑level events ──────────────────────────────────────────────

  function registerPresenceOnlyEvents(socket: Socket) {
    socket.on(
      CONNECTION_EVENT.VR_PRESENCE,
      (
        payload: VrPresenceRequest,
        ack?: (response: VrPresenceResponse) => void,
      ) => {
        if (typeof ack !== 'function') {
          return
        }

        const roomCodes = Array.isArray(payload?.roomCodes)
          ? payload.roomCodes
          : []
        ack({ presence: registry.getVrPresence(roomCodes) })
      },
    )

    logger.info('socket.presence.connected', {
      socketId: socket.id,
    })
  }

  function registerConnectionEvents(roomCode: string, socket: Socket) {
    socket.on(
      CONNECTION_EVENT.DEVICE_STATUS,
      (_payload: unknown, ack?: (res: DeviceStatusResponse) => void) => {
        if (typeof ack === 'function') {
          ack({ status: registry.getDeviceStatus(roomCode) })
        }
      },
    )
  }

  function handleRolePeerReplaced(
    incomingSocket: SocketWithRole,
    outcome: RolePeerReplacedOutcome,
  ) {
    const {
      roomCode,
      roomPeerRole,
      replacedPeerSocketId,
      activePeerSocketId,
      roomComplete,
    } = outcome
    const replacedSocket = incomingSocket.nsp.sockets.get(replacedPeerSocketId)

    logger.info(ROLE_PEER_REPLACED_LOG_EVENT[roomPeerRole], {
      roomCode,
      replacedSocketId: replacedPeerSocketId,
      activePeerSocketId,
      role: roomPeerRole,
      ...getRoleSlotLogContext(roomCode),
    })

    if (replacedSocket) {
      replacedSocket.emit(ROOM_EVENT.ReplacementNotice, {
        roomCode,
        role: roomPeerRole,
        replacedBySocketId: incomingSocket.id,
        timestamp: Date.now(),
      } satisfies ReplacementNoticePayload)
      replacedSocket.disconnect(true)
    }

    registerRoomEvents(roomCode, incomingSocket, roomPeerRole, {
      emitMemberJoined: false,
      roomComplete,
    })
  }

  function handleRoleSlotJoined(
    socket: SocketWithRole,
    outcome: RoleSlotJoinedOutcome,
  ) {
    const { roomCode, roomPeerRole, roomComplete } = outcome

    logger.info('socket.room.role_slot_joined', {
      socketId: socket.id,
      roomCode,
      role: roomPeerRole,
      ...getRoleSlotLogContext(roomCode),
    })

    registerRoomEvents(roomCode, socket, roomPeerRole, { roomComplete })
  }

  function registerSocketHandlers(roomCode: string, socket: SocketWithRole) {
    registerConnectionEvents(roomCode, socket)

    if (simulation) {
      for (const key in vrCommSim) {
        vrCommSim[key as keyof typeof vrCommSim](roomCode, socket)
      }
      return
    }

    registerRelayEvents(PROGRAM_RELAY, roomCode, socket)
    registerRelayEvents(CASTING_RELAY, roomCode, socket)
    registerRelayEvents(DEVICE_RELAY, roomCode, socket)
    registerRelayEvents(VIDEO_RELAY, roomCode, socket)
  }

  // ── Public API ───────────────────────────────────────────────────────────

  function connectionHandler(socket: Socket) {
    const socketWithRole = socket as SocketWithRole
    const connectionMode = socket.handshake.query.mode

    if (connectionMode === 'presence') {
      registerPresenceOnlyEvents(socket)
      return
    }

    const roomCode = socket.handshake.query.roomCode as string
    const roleQuery = socket.handshake.query.role

    logger.info('socket.connection.open', {
      socketId: socket.id,
      roomCode: roomCode || 'missing',
      hasRoomCode: Boolean(roomCode),
      role: typeof roleQuery === 'string' ? roleQuery : 'missing',
      simulationEnabled: simulation,
    })

    if (!roomCode) {
      rejectConnection(
        socket,
        'missing_room_code',
        'Room code was not received.',
        {
          role: roleQuery,
        },
      )
      return
    }

    const roomPeerRole = parseRoomPeerRole(roleQuery)
    if (!roomPeerRole) {
      let message: string
      if (roleQuery === undefined || roleQuery === '') {
        message = 'Room peer role is required.'
      } else {
        message = 'Unknown room peer role.'
      }
      rejectConnection(socket, 'invalid_room_peer_role', message, {
        roomCode,
        role: roleQuery,
      })
      return
    }

    socketWithRole.data.roomPeerRole = roomPeerRole

    const joinOutcome = registry.joinRoleSlot({
      roomCode,
      peerSocketId: socket.id,
      roomPeerRole,
    })

    socket.join(roomCode)

    switch (joinOutcome.kind) {
      case 'role_peer_replaced':
        handleRolePeerReplaced(socketWithRole, joinOutcome)
        break
      case 'role_slot_joined':
        handleRoleSlotJoined(socketWithRole, joinOutcome)
        break
    }

    registerSocketHandlers(roomCode, socketWithRole)
  }

  function runStaleRoomCleanup(now = Date.now()): RoomEvictedOutcome[] {
    const evictedRooms = registry.evictStaleRooms(now)

    for (const outcome of evictedRooms) {
      const {
        roomCode,
        ageMs,
        reason,
        consoleActivePeerSocketId,
        vrActivePeerSocketId,
      } = outcome
      logger.info('socket.room.cleaned', {
        roomCode,
        ageMs,
        reason,
        consoleActivePeerSocketId,
        vrActivePeerSocketId,
      })
    }

    return evictedRooms
  }

  function logRoomSnapshot() {
    const activeRoomCount = registry.getActiveRoomCount()
    if (activeRoomCount === 0) return

    logger.debug('socket.rooms.snapshot', {
      activeRoomCount,
      rooms: registry.listRoomSnapshots(),
    })
  }

  return { connectionHandler, runStaleRoomCleanup, logRoomSnapshot }
}
