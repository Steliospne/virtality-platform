import type { Socket } from 'socket.io-client'
import {
  PROGRAM_EVENT,
  DEVICE_EVENT,
  GAME_EVENT,
  CASTING_EVENT,
  CONNECTION_EVENT,
  VIDEO_EVENT,
  type ProgramEventPayloads,
  type DeviceEventPayloads,
  type GameEventPayloads,
  type CastingEventPayloads,
  type VideoEventPayloads,
  type DeviceStatusResponse,
} from '@virtality/shared/types'

// ── Generic subscription ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => void

/**
 * The headset's `SendSocketCall(FunctionsSent, string data)` emits every
 * payload as the JSON *text* it serialised itself, so an object payload
 * reaches the console as a string: `payload.videoId` is `undefined` and the
 * relay log cannot tell the two apart. Only text that looks like a JSON
 * object or array is parsed; a bare id such as `videoDownloadAck`'s videoId
 * is passed through untouched (a digits-only id must not become a number).
 */
export function parseHeadsetPayload(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const first = value.trimStart()[0]
  if (first !== '{' && first !== '[') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

/**
 * A boolean the headset sends arrives as text (`"true"`, or C#'s `"True"`),
 * and a non-empty string is truthy, so it must not be used as a boolean
 * directly. Anything unrecognised is `null` so the caller can ignore it.
 */
export function parseHeadsetBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return null
}

/**
 * Subscribe to socket events using a shared event-constant object as the map.
 * Handler keys correspond to the keys of the event map (e.g. `PROGRAM_EVENT`),
 * and the wire name is looked up automatically. Every argument goes through
 * `parseHeadsetPayload` first, so handlers never see a JSON string where the
 * payload type says object.
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
    const parsed: EventHandler = (...args) =>
      handler(...args.map(parseHeadsetPayload))
    on(wireEvent, parsed)
    active.push([wireEvent, parsed])
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
  video: EmitterGroup<typeof VIDEO_EVENT, VideoEventPayloads>
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
    video: createEmitterGroup(socket, VIDEO_EVENT),
    checkDeviceStatus: (ack) =>
      socket.emit(CONNECTION_EVENT.DEVICE_STATUS, null, ack),
  } as DeviceEmitter
}
