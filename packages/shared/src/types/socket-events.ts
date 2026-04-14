// ---------------------------------------------------------------------------
// Socket wire‑protocol – single source of truth for event names & payloads
// ---------------------------------------------------------------------------

// ── Connection events ──────────────────────────────────────────────────────

export const CONNECTION_EVENT = {
  CONNECTION: 'connection',
  DISCONNECTION: 'disconnect',
  ERROR: 'onError',
  DEVICE_STATUS: 'onDeviceStatus',
} as const

export type ConnectionEventKey = keyof typeof CONNECTION_EVENT

// ── Room events ────────────────────────────────────────────────────────────

export const ROOM_EVENT = {
  RoomJoined: 'roomJoined',
  MemberJoined: 'memberJoined',
  RoomComplete: 'roomComplete',
  MemberLeft: 'memberLeft',
} as const

export type RoomEventKey = keyof typeof ROOM_EVENT

// ── Device events ────────────────────────────────────────────────

export const DEVICE_EVENT = {
  SendDeviceId: 'sendDeviceId',
  SendDeviceIdAck: 'sendDeviceIdAck',
  ResetDeviceId: 'resetDeviceId',
} as const

export type DeviceEventKey = keyof typeof DEVICE_EVENT

// ── Program events ────────────────────────────────────────────────

export const PROGRAM_EVENT = {
  Start: 'programStart',
  StartAck: 'programStartAck',
  Pause: 'programPause',
  PauseAck: 'programPauseAck',
  End: 'programEnd',
  EndAck: 'programEndAck',
  ChangeExercise: 'onChangeExercise',
  ChangeExerciseAck: 'onChangeExerciseAck',
  RepEnd: 'onRepEnd',
  SetEnd: 'onSetEnd',
  WarmupStart: 'warmupStart',
  WarmupEnd: 'warmupEnd',
  WarmupStartAck: 'warmupStartAck',
  WarmupEndAck: 'warmupEndAck',
  SettingsChange: 'exerciseSettingsChange',
  SettingsChangeAck: 'exerciseSettingsChangeAck',
  CalibrateHeight: 'calibrateHeight',
  CalibrateHeightAck: 'calibrateHeightAck',
  ResetPosition: 'resetPosition',
  ResetPositionAck: 'resetPositionAck',
  SittingChange: 'onSittingChange',
  SittingChangeAck: 'onSittingChangeAck',
} as const

export type ProgramEventKey = keyof typeof PROGRAM_EVENT

// ── Game events ────────────────────────────────────────────────────────────

export const GAME_EVENT = {
  Load: 'onGameLoad',
  LoadAck: 'onGameLoadAck',
  Start: 'onGameStart',
  StartAck: 'onGameStartAck',
  End: 'onGameEnd',
  EndAck: 'onGameEndAck',
  RoundEnd: 'onRoundEnd',
  OnHit: 'onHit',
} as const

export type GameEventKey = keyof typeof GAME_EVENT

// ── WebRTC / casting events ────────────────────────────────────────────────

export const CASTING_EVENT = {
  RequestOffer: 'onRequestOffer',
  Offer: 'onOffer',
  Answer: 'onAnswer',
  StopCasting: 'onStopCasting',
} as const

export type CastingEventKey = keyof typeof CASTING_EVENT

// ── System events ──────────────────────────────────────────────────────────

export const SYSTEM_EVENT = {
  NotifyDoctor: 'onNotifyDoctor',
} as const

export type SystemEventKey = keyof typeof SYSTEM_EVENT

// ── Relay metadata (server‑side concern) ───────────────────────────────────
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

// ── Payload types (wire‑format, dependency‑free) ───────────────────────────

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

// ── Emit payload maps (keyed by event‑constant key) ─────────────────────────
// Each tuple defines the arguments for socket.emit(). Add an entry here when
// adding a new event above -- the controller derives its types from these maps.

export type ProgramEventPayloads = {
  Start: [payload: ProgramStartPayload]
  StartAck: []
  Pause: []
  PauseAck: []
  End: []
  EndAck: []
  ChangeExercise: [exerciseId: string]
  ChangeExerciseAck: []
  RepEnd: [payload: string]
  SetEnd: [payload: string]
  WarmupStart: [payload: WarmupPayload]
  WarmupEnd: []
  WarmupStartAck: []
  WarmupEndAck: []
  SettingsChange: [payload: ExercisePayload]
  SettingsChangeAck: []
  CalibrateHeight: []
  CalibrateHeightAck: []
  ResetPosition: []
  ResetPositionAck: []
  SittingChange: [sitting: boolean]
  SittingChangeAck: []
}

export type DeviceEventPayloads = {
  SendDeviceId: [payload: string]
  SendDeviceIdAck: []
  ResetDeviceId: []
}

export type GameEventPayloads = {
  Load: [payload: { avatarId: number }]
  LoadAck: []
  Start: []
  StartAck: []
  End: []
  EndAck: []
  RoundEnd: []
  OnHit: [payload: unknown]
}

export type CastingEventPayloads = {
  RequestOffer: []
  Offer: [offer: unknown]
  Answer: [answer: SDPDescription]
  StopCasting: []
}
