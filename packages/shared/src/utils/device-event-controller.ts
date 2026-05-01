import type { Socket } from 'socket.io-client'
import {
  PROGRAM_EVENTS,
  DEVICE_EVENTS,
  GAME_EVENTS,
  CASTING_EVENTS,
  CONNECTION_EVENTS,
  EVENT_DEFS,
} from '../types/socket-events.js'
import type {
  EventDefs,
  DeviceStatusResponse,
  EventDef,
  DeviceEvents,
  ProgramEvents,
  GameEvents,
  CastingEvents,
} from '../types/socket-events.js'

type EventMap = Record<string, EventDef<unknown[]>>

type ArgsOf<E> = E extends EventDef<infer A> ? A : never

type HandlerGroup<M extends EventMap, ReturnType> = {
  [K in keyof M]: (...args: ArgsOf<M[K]>) => ReturnType
}

type EmitterGroup<M extends EventMap> = HandlerGroup<M, void>

type HandlersMap = Partial<HandlerGroup<EventDefs, unknown>>

type HandlersMapKeys = keyof EventDefs

type Handler = NonNullable<HandlersMap[HandlersMapKeys]>

export type DeviceEmitter = {
  program: EmitterGroup<ProgramEvents>
  device: EmitterGroup<DeviceEvents>
  game: EmitterGroup<GameEvents>
  casting: EmitterGroup<CastingEvents>
  checkDeviceStatus: (ack: (res: DeviceStatusResponse) => void) => void
}

export function EventController(socket: Socket) {
  const on: (ev: string, fn: Handler) => void = socket.on.bind(socket)
  const off: (ev: string, fn: Handler) => void = socket.off.bind(socket)

  const subscribe = (handlers: HandlersMap): (() => void) => {
    const activeEvents: [string, Handler][] = []

    for (const key in handlers) {
      const typedKey = key as keyof EventDefs
      const handler = handlers[typedKey]
      if (!handler) continue
      const wireEvent = EVENT_DEFS[typedKey].wire

      on(wireEvent, handler)
      activeEvents.push([wireEvent, handler])
    }

    return () => {
      for (const [event, handler] of activeEvents) {
        off(event, handler)
      }
    }
  }

  const createEmitterGroup = <Defs extends EventMap>(
    eventDefs: Defs,
  ): EmitterGroup<Defs> => {
    const emit = socket.emit.bind(socket) as Socket['emit']

    const group: Record<string, (...args: unknown[]) => void> = {}

    for (const key in eventDefs) {
      const def = eventDefs[key]
      if (!def) continue
      const wireEvent = def.wire
      group[key] = (...args) => {
        emit(wireEvent, ...args)
      }
    }

    return group as EmitterGroup<Defs>
  }

  const emitter: DeviceEmitter = {
    program: createEmitterGroup(PROGRAM_EVENTS),
    device: createEmitterGroup(DEVICE_EVENTS),
    game: createEmitterGroup(GAME_EVENTS),
    casting: createEmitterGroup(CASTING_EVENTS),
    checkDeviceStatus: (ack) =>
      socket.emit(CONNECTION_EVENTS.DEVICE_STATUS.wire, null, ack),
  }

  return { subscribe, emitter }
}
