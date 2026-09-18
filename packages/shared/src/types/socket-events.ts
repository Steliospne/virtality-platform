// ---------------------------------------------------------------------------
// Socket wire‑protocol – single source of truth for event names & payloads
// ---------------------------------------------------------------------------

// ── Connection events ──────────────────────────────────────────────────────

export const CONNECTION_EVENT = {
  CONNECTION: 'connection',
  DISCONNECTION: 'disconnect',
  ERROR: 'onError',
  DEVICE_STATUS: 'onDeviceStatus',
  VR_PRESENCE: 'checkVrPresence',
} as const

export type ConnectionEventKey = keyof typeof CONNECTION_EVENT

// ── Room events ────────────────────────────────────────────────────────────

export const ROOM_EVENT = {
  RoomJoined: 'roomJoined',
  MemberJoined: 'memberJoined',
  RoomComplete: 'roomComplete',
  MemberLeft: 'memberLeft',
  ReplacementNotice: 'replacementNotice',
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
  ToggleCoach: 'onToggleCoach',
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
  StopCastingAck: 'onStopCastingAck',
  Candidate: 'onIceCandidate',
} as const

export type CastingEventKey = keyof typeof CASTING_EVENT

// ── System events ──────────────────────────────────────────────────────────

export const SYSTEM_EVENT = {
  NotifyDoctor: 'onNotifyDoctor',
} as const

export type SystemEventKey = keyof typeof SYSTEM_EVENT

// ── Immersive Video events ─────────────────────────────────────────────────

export const VIDEO_EVENT = {
  LibraryStateRequest: 'videoLibraryStateRequest',
  LibraryState: 'videoLibraryState',
  DownloadStart: 'videoDownloadStart',
  DownloadAck: 'videoDownloadAck',
  DownloadProgress: 'videoDownloadProgress',
  DownloadComplete: 'videoDownloadComplete',
  DownloadFailed: 'videoDownloadFailed',
  DownloadPause: 'videoDownloadPause',
  DownloadPaused: 'videoDownloadPaused',
  DownloadCancel: 'videoDownloadCancel',
  DownloadCancelAck: 'videoDownloadCancelAck',
  DownloadCancelComplete: 'videoDownloadCancelComplete',
  DownloadCancelFailed: 'videoDownloadCancelFailed',
  Delete: 'videoDelete',
  DeleteAck: 'videoDeleteAck',
  DeleteComplete: 'videoDeleteComplete',
  DeleteFailed: 'videoDeleteFailed',
  Play: 'videoPlay',
  PlayAck: 'videoPlayAck',
  Pause: 'videoPause',
  Stop: 'videoStop',
  StopAck: 'videoStopAck',
  PlaybackProgress: 'videoPlaybackProgress',
  Ended: 'videoEnded',
} as const

export type VideoEventKey = keyof typeof VIDEO_EVENT

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
  ToggleCoach: { name: PROGRAM_EVENT.ToggleCoach, payload: true },
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
  RequestOffer: { name: CASTING_EVENT.RequestOffer, payload: true },
  Offer: { name: CASTING_EVENT.Offer, payload: true },
  Answer: { name: CASTING_EVENT.Answer, payload: true },
  StopCasting: { name: CASTING_EVENT.StopCasting, payload: false },
  StopCastingAck: { name: CASTING_EVENT.StopCastingAck, payload: false },
  Candidate: { name: CASTING_EVENT.Candidate, payload: true },
} as const

export const VIDEO_RELAY = {
  LibraryStateRequest: {
    name: VIDEO_EVENT.LibraryStateRequest,
    payload: false,
  },
  LibraryState: { name: VIDEO_EVENT.LibraryState, payload: true },
  DownloadStart: { name: VIDEO_EVENT.DownloadStart, payload: true },
  DownloadAck: { name: VIDEO_EVENT.DownloadAck, payload: true },
  DownloadProgress: { name: VIDEO_EVENT.DownloadProgress, payload: true },
  DownloadComplete: { name: VIDEO_EVENT.DownloadComplete, payload: true },
  DownloadFailed: { name: VIDEO_EVENT.DownloadFailed, payload: true },
  DownloadPause: { name: VIDEO_EVENT.DownloadPause, payload: true },
  DownloadPaused: { name: VIDEO_EVENT.DownloadPaused, payload: true },
  DownloadCancel: { name: VIDEO_EVENT.DownloadCancel, payload: true },
  DownloadCancelAck: { name: VIDEO_EVENT.DownloadCancelAck, payload: true },
  DownloadCancelComplete: {
    name: VIDEO_EVENT.DownloadCancelComplete,
    payload: true,
  },
  DownloadCancelFailed: {
    name: VIDEO_EVENT.DownloadCancelFailed,
    payload: true,
  },
  Delete: { name: VIDEO_EVENT.Delete, payload: true },
  DeleteAck: { name: VIDEO_EVENT.DeleteAck, payload: true },
  DeleteComplete: { name: VIDEO_EVENT.DeleteComplete, payload: true },
  DeleteFailed: { name: VIDEO_EVENT.DeleteFailed, payload: true },
  Play: { name: VIDEO_EVENT.Play, payload: true },
  PlayAck: { name: VIDEO_EVENT.PlayAck, payload: true },
  Pause: { name: VIDEO_EVENT.Pause, payload: false },
  Stop: { name: VIDEO_EVENT.Stop, payload: true },
  StopAck: { name: VIDEO_EVENT.StopAck, payload: true },
  PlaybackProgress: { name: VIDEO_EVENT.PlaybackProgress, payload: true },
  Ended: { name: VIDEO_EVENT.Ended, payload: false },
} as const satisfies Record<VideoEventKey, RelayEntry>

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
  settings: VRPayloadSettings & { coachEnabled: boolean }
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

export type ReplacementNoticePayload = {
  roomCode: string
  role: RoomPeerRole
  replacedBySocketId: string
  timestamp: number
}

export type DeviceStatusResponse = {
  status: 'active' | 'inactive'
}

export type VrPresenceRequest = {
  roomCodes: string[]
}

export type VrPresenceResponse = {
  presence: Record<string, boolean>
}

export const ROOM_PEER_ROLE = {
  Console: 'console',
  Vr: 'vr',
} as const

export type RoomPeerRole = (typeof ROOM_PEER_ROLE)[keyof typeof ROOM_PEER_ROLE]

export function parseRoomPeerRole(role: unknown): RoomPeerRole | null {
  if (role === ROOM_PEER_ROLE.Console || role === ROOM_PEER_ROLE.Vr) {
    return role
  }
  return null
}

/**
 * Every single-id video event carries the `videoId` as the first Socket.IO
 * argument, a bare string, so the headset reads it at argument index 0.
 * Used by `videoDownloadStart`, `videoDownloadPause`, `videoDownloadCancel`,
 * `videoDelete`, `videoPlay`, `videoStop`, `videoDownloadAck`,
 * `videoDownloadComplete`, `videoDownloadCancelAck`,
 * `videoDownloadCancelComplete`, `videoDeleteAck`, `videoDeleteComplete`,
 * `videoPlayAck` and `videoStopAck`. Every other video event carries an
 * object.
 *
 * The headset emits an object payload as the JSON text it serialised
 * itself (`SendSocketCall(FunctionsSent, string data)`), so it arrives as a
 * string. The relay forwards it untouched; the console's `subscribe()`
 * parses it before any handler runs. Read a headset payload only through
 * `subscribe()`; a raw `socket.on` sees the string.
 */
export type VideoIdArgs = [videoId: string]

/** A video the headset does not list is absent; there is no `absent` status. */
export const VIDEO_DEVICE_STATUS = {
  Downloading: 'downloading',
  /** Physio paused it; resumed only by a new `DownloadStart`. Not yet sent by the headset. */
  Paused: 'paused',
  Ready: 'ready',
  Failed: 'failed',
} as const

export type VideoDeviceStatus =
  (typeof VIDEO_DEVICE_STATUS)[keyof typeof VIDEO_DEVICE_STATUS]

/**
 * The headset lists a ready video as `videoId` + `status` only; the byte
 * fields are optional and only meaningful while `downloading` or `paused`.
 */
export type VideoLibraryEntry = {
  videoId: string
  status: VideoDeviceStatus
  bytesDownloaded?: number
  sizeBytes?: number
  /** Present when status is `failed`. */
  reason?: VideoDownloadFailureReason
}

export type VideoLibraryStatePayload = {
  videos: VideoLibraryEntry[]
  /** Free bytes on the volume that stores videos. Console uses this to warn before a download. */
  freeBytes: number
}

/**
 * `sizeBytes` is the headset's estimate (`bytesDownloaded / PercentComplete`
 * from Addressables), not the object length; the console takes the real
 * size from the catalog and uses these only to draw the progress bar.
 */
export type VideoDownloadProgressPayload = {
  videoId: string
  bytesDownloaded: number
  sizeBytes: number
  /** True while the headset is retrying after a lost connection. Not yet sent by the headset. */
  stalled?: boolean
}

export type VideoDownloadPausedPayload = {
  videoId: string
  bytesDownloaded: number
}

/** The headset currently reports `unavailable` and `network` only. */
export const VIDEO_DOWNLOAD_FAILURE_REASON = {
  InsufficientStorage: 'insufficient_storage',
  /** Addressables failed to download the bundle. */
  Network: 'network',
  ChecksumMismatch: 'checksum_mismatch',
  UrlExpired: 'url_expired',
  /** The `videoId` is not an Addressables key the headset knows. */
  Unavailable: 'unavailable',
} as const

export type VideoDownloadFailureReason =
  (typeof VIDEO_DOWNLOAD_FAILURE_REASON)[keyof typeof VIDEO_DOWNLOAD_FAILURE_REASON]

export type VideoDownloadFailedPayload = {
  videoId: string
  reason: VideoDownloadFailureReason
}

/** `videoDownloadCancelFailed` and `videoDeleteFailed` share the download-failure shape. */
export type VideoDownloadCancelFailedPayload = VideoDownloadFailedPayload
export type VideoDeleteFailedPayload = VideoDownloadFailedPayload

export type VideoPlaybackProgressPayload = {
  videoId: string
  positionSec: number
  durationSec: number
  /** True while playback is paused; progress keeps emitting so a (re)joining console can re-attach. */
  paused: boolean
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
  ToggleCoach: [coachEnabled: boolean]
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
  RequestOffer: [payload: string]
  Offer: [offer: unknown]
  Answer: [answer: SDPDescription]
  StopCasting: []
  StopCastingAck: []
  Candidate: [candidate: unknown]
}

export type VideoEventPayloads = {
  LibraryStateRequest: []
  LibraryState: [payload: VideoLibraryStatePayload]
  DownloadStart: VideoIdArgs
  DownloadAck: VideoIdArgs
  DownloadProgress: [payload: VideoDownloadProgressPayload]
  DownloadComplete: VideoIdArgs
  DownloadFailed: [payload: VideoDownloadFailedPayload]
  DownloadPause: VideoIdArgs
  DownloadPaused: [payload: VideoDownloadPausedPayload]
  DownloadCancel: VideoIdArgs
  DownloadCancelAck: VideoIdArgs
  DownloadCancelComplete: VideoIdArgs
  DownloadCancelFailed: [payload: VideoDownloadCancelFailedPayload]
  Delete: VideoIdArgs
  DeleteAck: VideoIdArgs
  DeleteComplete: VideoIdArgs
  DeleteFailed: [payload: VideoDeleteFailedPayload]
  Play: VideoIdArgs
  PlayAck: VideoIdArgs
  Pause: []
  Stop: VideoIdArgs
  StopAck: VideoIdArgs
  PlaybackProgress: [payload: VideoPlaybackProgressPayload]
  Ended: []
}
