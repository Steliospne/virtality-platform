// ---------------------------------------------------------------------------
// Socket wire-protocol – single source of truth for event names & payloads
// ---------------------------------------------------------------------------

export type EventDef<
  Args extends unknown[] = [],
  Wire extends string = string,
> = {
  wire: Wire
  // phantom field only for typing
  __args?: Args
}

type EventDefMap = Record<string, EventDef<unknown[], string>>

export type EventPayloadMap<M extends EventDefMap> = {
  [K in keyof M]: M[K] extends EventDef<infer Args, string> ? Args : never
}

type EventWireMap<M extends EventDefMap> = {
  [K in keyof M]: M[K]['wire']
}

const event = <Args extends unknown[] = [], Wire extends string = string>(
  wire: Wire,
) => ({ wire }) as EventDef<Args, Wire>

const toWireMap = <M extends EventDefMap>(defs: M): EventWireMap<M> =>
  Object.fromEntries(
    Object.entries(defs).map(([key, value]) => [key, value.wire]),
  ) as EventWireMap<M>

// ── Payload types (wire-format, dependency-free) ───────────────────────────

export type ExercisePayload = {
  id: string
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

export type VRPayloadSettings = {
  avatarId: string
  sessionNumber: number
  mapId: string
  language?: string
}

export type ProgramStartPayload = {
  exerciseData: ExercisePayload[]
  settings: VRPayloadSettings
}

export type WarmupPayload = {
  settings: VRPayloadSettings
}

export type SDPDescription = {
  type: string
  sdp?: string
}

export type RoomJoinedPayload = {
  roomCode: string
  memberId: string
}

export type MemberJoinedPayload = {
  memberId: string
  timestamp: number
}

export type RoomCompletePayload = {
  roomCode: string
  timestamp: number
}

export type MemberLeftPayload = {
  memberId: string
  timestamp: number
}

export type DeviceStatusResponse = {
  status: 'active' | 'inactive'
}

export type Room = {
  id: string
  firstMemberId: null | string
  secondMemberId: null | string
  createdAt: number
  members: number
}

// ── Event definitions (single source of truth) ─────────────────────────────

export const CONNECTION_EVENTS = {
  CONNECTION: event('connection'),
  DISCONNECTION: event('disconnect'),
  ERROR: event('onError'),
  DEVICE_STATUS:
    event<[payload: null, ack: (res: DeviceStatusResponse) => void]>(
      'onDeviceStatus',
    ),
} as const

export type ConnectionEvents = typeof CONNECTION_EVENTS

export const ROOM_EVENTS = {
  RoomJoined: event<[payload: RoomJoinedPayload]>('roomJoined'),
  MemberJoined: event<[payload: MemberJoinedPayload]>('memberJoined'),
  RoomComplete: event<[payload: RoomCompletePayload]>('roomComplete'),
  MemberLeft: event<[payload: MemberLeftPayload]>('memberLeft'),
} as const

export const DEVICE_EVENTS = {
  SendDeviceId: event<[payload: string]>('sendDeviceId'),
  SendDeviceIdAck: event('sendDeviceIdAck'),
  ResetDeviceId: event('resetDeviceId'),
} as const

export type DeviceEvents = typeof DEVICE_EVENTS

export const PROGRAM_EVENTS = {
  Start: event<[payload: ProgramStartPayload]>('programStart'),
  StartAck: event('programStartAck'),
  Pause: event('programPause'),
  PauseAck: event('programPauseAck'),
  End: event('programEnd'),
  EndAck: event('programEndAck'),
  ChangeExercise: event<[exerciseId: string]>('onChangeExercise'),
  ChangeExerciseAck: event('onChangeExerciseAck'),
  RepEnd: event<[payload: string]>('onRepEnd'),
  SetEnd: event<[payload: string]>('onSetEnd'),
  WarmupStart: event<[payload: WarmupPayload]>('warmupStart'),
  WarmupEnd: event('warmupEnd'),
  WarmupStartAck: event('warmupStartAck'),
  WarmupEndAck: event('warmupEndAck'),
  SettingsChange: event<[payload: ExercisePayload]>('exerciseSettingsChange'),
  SettingsChangeAck: event('exerciseSettingsChangeAck'),
  CalibrateHeight: event('calibrateHeight'),
  CalibrateHeightAck: event('calibrateHeightAck'),
  ResetPosition: event('resetPosition'),
  ResetPositionAck: event('resetPositionAck'),
  SittingChange: event<[sitting: boolean]>('onSittingChange'),
  SittingChangeAck: event('onSittingChangeAck'),
} as const

export type ProgramEvents = typeof PROGRAM_EVENTS

export const GAME_EVENTS = {
  Load: event<[payload: { avatarId: number }]>('onGameLoad'),
  LoadAck: event('onGameLoadAck'),
  Start: event('onGameStart'),
  StartAck: event('onGameStartAck'),
  End: event('onGameEnd'),
  EndAck: event('onGameEndAck'),
  RoundEnd: event('onRoundEnd'),
  OnHit: event<[payload: unknown]>('onHit'),
} as const

export type GameEvents = typeof GAME_EVENTS

export const CASTING_EVENTS = {
  RequestOffer: event('onRequestOffer'),
  Offer: event<[offer: unknown]>('onOffer'),
  Answer: event<[answer: SDPDescription]>('onAnswer'),
  StopCasting: event('onStopCasting'),
} as const

export type CastingEvents = typeof CASTING_EVENTS

export const SYSTEM_EVENTS = {
  NotifyDoctor: event('onNotifyDoctor'),
} as const

export type SystemEvents = typeof SYSTEM_EVENTS

// Backward-compatible wire maps for existing callers.
export const CONNECTION_EVENT = toWireMap(CONNECTION_EVENTS)
export const ROOM_EVENT = toWireMap(ROOM_EVENTS)
export const DEVICE_EVENT = toWireMap(DEVICE_EVENTS)
export const PROGRAM_EVENT = toWireMap(PROGRAM_EVENTS)
export const GAME_EVENT = toWireMap(GAME_EVENTS)
export const CASTING_EVENT = toWireMap(CASTING_EVENTS)
export const SYSTEM_EVENT = toWireMap(SYSTEM_EVENTS)

export type ConnectionEventKey = keyof typeof CONNECTION_EVENT
export type RoomEventKey = keyof typeof ROOM_EVENT
export type DeviceEventKey = keyof typeof DEVICE_EVENT
export type ProgramEventKey = keyof typeof PROGRAM_EVENT
export type GameEventKey = keyof typeof GAME_EVENT
export type CastingEventKey = keyof typeof CASTING_EVENT
export type SystemEventKey = keyof typeof SYSTEM_EVENT

// Backward-compatible payload-map aliases derived from event definitions.
export type ProgramEventPayloads = EventPayloadMap<typeof PROGRAM_EVENTS>
export type DeviceEventPayloads = EventPayloadMap<typeof DEVICE_EVENTS>
export type GameEventPayloads = EventPayloadMap<typeof GAME_EVENTS>
export type CastingEventPayloads = EventPayloadMap<typeof CASTING_EVENTS>

// ── Relay metadata (server-side concern) ───────────────────────────────────
// The socket relay handler needs to know whether to forward the payload.
// `true` = relay the payload arg to the other room peer.

type RelayEntry = { readonly name: string; readonly payload: boolean }

export type RelayEventMap = Readonly<Record<string, RelayEntry>>

export const PROGRAM_RELAY: RelayEventMap = {
  Start: { name: PROGRAM_EVENT.Start, payload: true },
  StartAck: { name: PROGRAM_EVENT.StartAck, payload: false },
  Pause: { name: PROGRAM_EVENT.Pause, payload: false },
  PauseAck: { name: PROGRAM_EVENT.PauseAck, payload: false },
  End: { name: PROGRAM_EVENT.End, payload: false },
  EndAck: { name: PROGRAM_EVENT.EndAck, payload: false },
  ChangeExercise: { name: PROGRAM_EVENT.ChangeExercise, payload: true },
  ChangeExerciseAck: { name: PROGRAM_EVENT.ChangeExerciseAck, payload: false },
  RepEnd: { name: PROGRAM_EVENT.RepEnd, payload: true },
  SetEnd: { name: PROGRAM_EVENT.SetEnd, payload: true },
  WarmupStart: { name: PROGRAM_EVENT.WarmupStart, payload: true },
  WarmupEnd: { name: PROGRAM_EVENT.WarmupEnd, payload: false },
  WarmupStartAck: { name: PROGRAM_EVENT.WarmupStartAck, payload: false },
  WarmupEndAck: { name: PROGRAM_EVENT.WarmupEndAck, payload: false },
  SettingsChange: { name: PROGRAM_EVENT.SettingsChange, payload: true },
  SettingsChangeAck: { name: PROGRAM_EVENT.SettingsChangeAck, payload: false },
  CalibrateHeight: { name: PROGRAM_EVENT.CalibrateHeight, payload: false },
  CalibrateHeightAck: {
    name: PROGRAM_EVENT.CalibrateHeightAck,
    payload: false,
  },
  ResetPosition: { name: PROGRAM_EVENT.ResetPosition, payload: false },
  ResetPositionAck: { name: PROGRAM_EVENT.ResetPositionAck, payload: false },
  SittingChange: { name: PROGRAM_EVENT.SittingChange, payload: true },
  SittingChangeAck: { name: PROGRAM_EVENT.SittingChangeAck, payload: false },
} as const

export const DEVICE_RELAY: RelayEventMap = {
  SendDeviceId: { name: DEVICE_EVENT.SendDeviceId, payload: true },
  SendDeviceIdAck: { name: DEVICE_EVENT.SendDeviceIdAck, payload: false },
  ResetDeviceId: { name: DEVICE_EVENT.ResetDeviceId, payload: false },
} as const

export const GAME_RELAY: RelayEventMap = {
  Load: { name: GAME_EVENT.Load, payload: true },
  LoadAck: { name: GAME_EVENT.LoadAck, payload: false },
  Start: { name: GAME_EVENT.Start, payload: false },
  StartAck: { name: GAME_EVENT.StartAck, payload: false },
  End: { name: GAME_EVENT.End, payload: false },
  EndAck: { name: GAME_EVENT.EndAck, payload: false },
  RoundEnd: { name: GAME_EVENT.RoundEnd, payload: false },
  OnHit: { name: GAME_EVENT.OnHit, payload: true },
} as const

export const CASTING_RELAY: RelayEventMap = {
  RequestOffer: { name: CASTING_EVENT.RequestOffer, payload: false },
  Offer: { name: CASTING_EVENT.Offer, payload: true },
  Answer: { name: CASTING_EVENT.Answer, payload: true },
  StopCasting: { name: CASTING_EVENT.StopCasting, payload: false },
} as const

export const EVENT_DEFS = {
  ...PROGRAM_EVENTS,
  ...DEVICE_EVENTS,
  // ...GAME_EVENTS,
  ...CASTING_EVENTS,
  ...CONNECTION_EVENTS,
  ...ROOM_EVENTS,
} as const

export type EventDefs = typeof EVENT_DEFS
