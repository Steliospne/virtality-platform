import type { Socket } from 'socket.io-client'
import {
  PROGRAM_EVENT,
  DEVICE_EVENT,
  GAME_EVENT,
  CASTING_EVENT,
  CONNECTION_EVENT,
  type ProgramEventPayloads,
  type DeviceEventPayloads,
  type GameEventPayloads,
  type CastingEventPayloads,
  type DeviceStatusResponse,
} from '@virtality/shared/types'

// ── Generic subscription ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => void

/**
 * Subscribe to socket events using a shared event-constant object as the map.
 * Handler keys correspond to the keys of the event map (e.g. `PROGRAM_EVENT`),
 * and the wire name is looked up automatically.
 *
 * Returns an unsubscribe function that removes all registered listeners.
 */
export function subscribe<M extends Record<string, string>>(
  socket: Socket,
  eventMap: M,
  handlers: Partial<Record<keyof M, EventHandler>>,
): () => void {
  const on = socket.on.bind(socket) as (ev: string, fn: EventHandler) => void
  const off = socket.off.bind(socket) as (ev: string, fn: EventHandler) => void
  const active: [string, EventHandler][] = []

  for (const key in handlers) {
    const handler = handlers[key]
    if (!handler) continue
    const wireEvent = eventMap[key]
    on(wireEvent, handler)
    active.push([wireEvent, handler])
  }

  return () => {
    for (const [event, handler] of active) {
      off(event, handler)
    }
  }
}

// ── Auto‑derived emitter types ──────────────────────────────────────────────

/**
 * Maps an event-constant object + payload map into a typed method group.
 *
 * - `EventMap`     – an event-constant object (e.g. `typeof PROGRAM_EVENT`)
 * - `PayloadMap`   – maps each key to its emit argument tuple
 *
 * When a key exists in `PayloadMap`, the method uses those typed args.
 * Otherwise it falls back to `(...args: unknown[]) => void`.
 */
type EmitterGroup<
  EventMap extends Record<string, string>,
  PayloadMap extends Partial<Record<keyof EventMap, unknown[]>>,
> = {
  [Key in keyof EventMap]: Key extends keyof PayloadMap
    ? PayloadMap[Key] extends infer Args extends unknown[]
      ? (...args: Args) => void
      : (...args: unknown[]) => void
    : (...args: unknown[]) => void
}

export type DeviceEmitter = {
  program: EmitterGroup<typeof PROGRAM_EVENT, ProgramEventPayloads>
  device: EmitterGroup<typeof DEVICE_EVENT, DeviceEventPayloads>
  game: EmitterGroup<typeof GAME_EVENT, GameEventPayloads>
  casting: EmitterGroup<typeof CASTING_EVENT, CastingEventPayloads>
  checkDeviceStatus: (ack: (res: DeviceStatusResponse) => void) => void
}

// ── Emitter factory ─────────────────────────────────────────────────────────

function createEmitterGroup<EventMap extends Record<string, string>>(
  socket: Socket,
  eventMap: EventMap,
): Record<keyof EventMap, EventHandler> {
  const emit = socket.emit.bind(socket) as (
    event: string,
    ...args: unknown[]
  ) => Socket

  const group: Record<string, EventHandler> = {}

  for (const key in eventMap) {
    const wireEvent = eventMap[key]
    group[key] = (...args) => emit(wireEvent, ...args)
  }

  return group as Record<keyof EventMap, EventHandler>
}

export function createDeviceEmitter(socket: Socket): DeviceEmitter {
  return {
    program: createEmitterGroup(socket, PROGRAM_EVENT),
    device: createEmitterGroup(socket, DEVICE_EVENT),
    game: createEmitterGroup(socket, GAME_EVENT),
    casting: createEmitterGroup(socket, CASTING_EVENT),
    checkDeviceStatus: (ack) =>
      socket.emit(CONNECTION_EVENT.DEVICE_STATUS, null, ack),
  } as DeviceEmitter
}
