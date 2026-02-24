export const CONNECTION_EVENT = {
  CONNECTION: 'connection',
  DISCONNECTION: 'disconnect',
  ERROR: 'onError',
  DEVICE_STATUS: 'onDeviceStatus',
} as const

export type ConnectionEventKey = keyof typeof CONNECTION_EVENT

export const _EVENT = {
  Start: { name: 'programStart', payload: true },
  StartAck: { name: 'programStartAck', payload: false },
  Pause: { name: 'programPause', payload: false },
  PauseAck: { name: 'programPauseAck', payload: false },
  End: { name: 'programEnd', payload: false },
  EndAck: { name: 'programEndAck', payload: false },
  ChangeExercise: { name: 'onChangeExercise', payload: true },
  ChangeExerciseAck: { name: 'onChangeExerciseAck', payload: false },
  RepEnd: { name: 'onRepEnd', payload: true },
  SetEnd: { name: 'onSetEnd', payload: true },
  WarmupStart: { name: 'warmupStart', payload: true },
  WarmupEnd: { name: 'warmupEnd', payload: false },
  WarmupStartAck: { name: 'warmupStartAck', payload: false },
  WarmupEndAck: { name: 'warmupEndAck', payload: false },
  SettingsChange: { name: 'exerciseSettingsChange', payload: true },
  SettingsChangeAck: { name: 'exerciseSettingsChangeAck', payload: false },
  CalibrateHeight: { name: 'calibrateHeight', payload: false },
  CalibrateHeightAck: { name: 'calibrateHeightAck', payload: false },
  ResetPosition: { name: 'resetPosition', payload: false },
  ResetPositionAck: { name: 'resetPositionAck', payload: false },
  SendDeviceId: { name: 'sendDeviceId', payload: true },
  SendDeviceIdAck: { name: 'sendDeviceIdAck', payload: false },
  ResetDeviceId: { name: 'resetDeviceId', payload: false },
  SittingChange: { name: 'onSittingChange', payload: true },
  SittingChangeAck: { name: 'onSittingChangeAck', payload: false },
} as const

export type EventKey = keyof typeof _EVENT

export const ROOM_EVENT = {
  MemberLeft: 'memberLeft',
  RoomComplete: 'roomComplete',
}

export type RoomEvent = keyof typeof ROOM_EVENT

export const GAME_EVENT = {
  Load: { name: 'onGameLoad', payload: true },
  LoadAck: { name: 'onGameLoadAck', payload: false },
  Start: { name: 'onGameStart', payload: false },
  StartAck: { name: 'onGameStartAck', payload: false },
  End: { name: 'onGameEnd', payload: false },
  EndAck: { name: 'onGameEndAck', payload: false },
  RoundEnd: { name: 'onRoundEnd', payload: false },
  OnHit: { name: 'onHit', payload: true },
} as const

export type GameEvent = keyof typeof GAME_EVENT

export type Room = {
  id: string
  firstMemberId: null | string
  secondMemberId: null | string
  createdAt: number
  members: number
}
