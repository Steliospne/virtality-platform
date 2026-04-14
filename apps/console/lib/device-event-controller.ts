import type { Socket } from 'socket.io-client'
import {
  PROGRAM_EVENT,
  GAME_EVENT,
  CASTING_EVENT,
  ROOM_EVENT,
  SYSTEM_EVENT,
  CONNECTION_EVENT,
  type ProgramStartPayload,
  type WarmupPayload,
  type ExercisePayload,
} from '@virtality/shared/types'

// ── Outbound (emit) helpers ────────────────────────────────────────────────

export interface DeviceEmitter {
  programStart: (payload: ProgramStartPayload) => void
  programPause: () => void
  programEnd: () => void
  programEndAck: () => void
  startWarmup: (payload: WarmupPayload) => void
  endWarmup: () => void
  settingsChange: (payload: ExercisePayload) => void
  changeExercise: (payload: string) => void
  calibrateHeight: () => void
  resetPosition: () => void
  sittingChange: (payload: boolean) => void
  sendDeviceIdAck: () => void
  gameLoad: (payload: { avatarId: number }) => void
  gameStart: () => void
  gameEnd: () => void
  requestCastingOffer: () => void
  sendCastingAnswer: (answer: RTCSessionDescriptionInit) => void
  stopCasting: () => void
  checkDeviceStatus: (ack: (res: { status: 'active' | 'inactive' }) => void) => void
}

export function createDeviceEmitter(socket: Socket): DeviceEmitter {
  return {
    programStart: (payload) => { socket.emit(PROGRAM_EVENT.Start, payload) },
    programPause: () => { socket.emit(PROGRAM_EVENT.Pause) },
    programEnd: () => { socket.emit(PROGRAM_EVENT.End) },
    programEndAck: () => { socket.emit(PROGRAM_EVENT.EndAck) },
    startWarmup: (payload) => { socket.emit(PROGRAM_EVENT.WarmupStart, payload) },
    endWarmup: () => { socket.emit(PROGRAM_EVENT.WarmupEnd) },
    settingsChange: (payload) => { socket.emit(PROGRAM_EVENT.SettingsChange, payload) },
    changeExercise: (payload) => { socket.emit(PROGRAM_EVENT.ChangeExercise, payload) },
    calibrateHeight: () => { socket.emit(PROGRAM_EVENT.CalibrateHeight) },
    resetPosition: () => { socket.emit(PROGRAM_EVENT.ResetPosition) },
    sittingChange: (payload) => { socket.emit(PROGRAM_EVENT.SittingChange, payload) },
    sendDeviceIdAck: () => { socket.emit(PROGRAM_EVENT.SendDeviceIdAck) },
    gameLoad: (payload) => { socket.emit(GAME_EVENT.Load, payload) },
    gameStart: () => { socket.emit(GAME_EVENT.Start) },
    gameEnd: () => { socket.emit(GAME_EVENT.End) },
    requestCastingOffer: () => { socket.emit(CASTING_EVENT.RequestOffer) },
    sendCastingAnswer: (answer) => { socket.emit(CASTING_EVENT.Answer, answer) },
    stopCasting: () => { socket.emit(CASTING_EVENT.StopCasting) },
    checkDeviceStatus: (ack) => { socket.emit(CONNECTION_EVENT.DEVICE_STATUS, undefined, ack) },
  }
}

// ── Inbound (subscribe) helpers ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (...args: any[]) => void

/**
 * Subscribes handlers to socket events described by an event map.
 * Returns a cleanup function that removes all listeners.
 *
 * `eventMap` maps handler keys → wire event names.
 * `handlers` maps the same keys → callback functions.
 */
function subscribeWithMap<M extends Record<string, string>>(
  socket: Socket,
  eventMap: M,
  handlers: { [K in keyof M]?: AnyHandler },
): () => void {
  const on = socket.on.bind(socket) as (ev: string, fn: AnyHandler) => void
  const off = socket.off.bind(socket) as (ev: string, fn: AnyHandler) => void
  const active: [string, AnyHandler][] = []
  for (const key in eventMap) {
    const handler = handlers[key]
    if (!handler) continue
    const event = eventMap[key]
    on(event, handler)
    active.push([event, handler])
  }
  return () => {
    for (const [event, handler] of active) {
      off(event, handler)
    }
  }
}

// ── Event maps (single source for key → wire-event) ───────────────────────

const DASHBOARD_EVENTS = {
  onStartAck: PROGRAM_EVENT.StartAck,
  onPauseAck: PROGRAM_EVENT.PauseAck,
  onEnd: PROGRAM_EVENT.End,
  onEndAck: PROGRAM_EVENT.EndAck,
  onChangeExercise: PROGRAM_EVENT.ChangeExercise,
  onChangeExerciseAck: PROGRAM_EVENT.ChangeExerciseAck,
  onRepEnd: PROGRAM_EVENT.RepEnd,
  onSetEnd: PROGRAM_EVENT.SetEnd,
  onWarmupStartAck: PROGRAM_EVENT.WarmupStartAck,
  onWarmupEndAck: PROGRAM_EVENT.WarmupEndAck,
  onCalibrateHeightAck: PROGRAM_EVENT.CalibrateHeightAck,
  onResetPositionAck: PROGRAM_EVENT.ResetPositionAck,
  onSettingsChangeAck: PROGRAM_EVENT.SettingsChangeAck,
  onSittingChange: PROGRAM_EVENT.SittingChange,
  onSittingChangeAck: PROGRAM_EVENT.SittingChangeAck,
  onMemberLeft: ROOM_EVENT.MemberLeft,
  onNotifyDoctor: SYSTEM_EVENT.NotifyDoctor,
} as const

const ROOM_EVENTS = {
  onRoomJoined: ROOM_EVENT.RoomJoined,
  onRoomComplete: ROOM_EVENT.RoomComplete,
  onMemberLeft: ROOM_EVENT.MemberLeft,
} as const

const PAIRING_EVENTS = {
  onSendDeviceId: PROGRAM_EVENT.SendDeviceId,
  onDisconnect: CONNECTION_EVENT.DISCONNECTION,
} as const

const CASTING_EVENTS = {
  onOffer: CASTING_EVENT.Offer,
} as const

// ── Handler types (derived from maps, with per-key signature overrides) ────

interface DashboardHandlerSignatures {
  onChangeExercise: (exerciseId: string) => void
  onRepEnd: (payload: string) => void
  onSetEnd: (payload: string) => void
  onSittingChange: (payload: string) => void
}

export type DashboardEventHandlers = {
  [K in keyof typeof DASHBOARD_EVENTS]?: K extends keyof DashboardHandlerSignatures
    ? DashboardHandlerSignatures[K]
    : () => void
}

export type RoomEventHandlers = {
  [K in keyof typeof ROOM_EVENTS]?: () => void
}

interface PairingHandlerSignatures {
  onSendDeviceId: (payload: string) => void
}

export type PairingEventHandlers = {
  [K in keyof typeof PAIRING_EVENTS]?: K extends keyof PairingHandlerSignatures
    ? PairingHandlerSignatures[K]
    : () => void
}

interface CastingHandlerSignatures {
  onOffer: (offerJson: unknown) => void
}

export type CastingEventHandlers = {
  [K in keyof typeof CASTING_EVENTS]?: K extends keyof CastingHandlerSignatures
    ? CastingHandlerSignatures[K]
    : () => void
}

// ── Subscribe functions ────────────────────────────────────────────────────

export function subscribeToDashboardEvents(
  socket: Socket,
  handlers: DashboardEventHandlers,
): () => void {
  return subscribeWithMap(socket, DASHBOARD_EVENTS, handlers)
}

export function subscribeToRoomEvents(
  socket: Socket,
  handlers: RoomEventHandlers,
): () => void {
  return subscribeWithMap(socket, ROOM_EVENTS, handlers)
}

export function subscribeToPairingEvents(
  socket: Socket,
  handlers: PairingEventHandlers,
): () => void {
  return subscribeWithMap(socket, PAIRING_EVENTS, handlers)
}

export function subscribeToCastingEvents(
  socket: Socket,
  handlers: CastingEventHandlers,
): () => void {
  return subscribeWithMap(socket, CASTING_EVENTS, handlers)
}
