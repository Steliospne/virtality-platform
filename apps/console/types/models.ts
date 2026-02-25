import {
  BugReportFormSchema,
  OrganizationMemberSchema,
  OrganizationSchema,
  PatientFormSchema,
  PatientProgramFormSchema,
  PresetFormSchema,
  ProgressDataSchema,
  RoleEnum,
  SignUpSchema,
} from '@/lib/definitions'
import { User } from '@/auth-client'
import {
  Avatar,
  Exercise,
  Map,
  Member,
  PatientProgram,
  ProgramExercise,
  PatientSession,
  SessionExercise,
  Device,
  PresetExercise,
  Preset,
  Patient,
  SessionData,
} from '@virtality/db'
import { z } from 'zod/v4'
import { Delta } from 'quill'
import { HumanState } from '@/data/static/human-body'
import { Socket } from 'socket.io-client'

export type SignUpForm = z.infer<typeof SignUpSchema>

export interface Organization extends z.infer<typeof OrganizationSchema> {
  isFrozen: boolean | null
}

export type OrganizationWithMembers = Organization & {
  members: (Member & { user: User })[]
}

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>

export interface CompleteProgramExercise extends ProgramExercise {
  exercise: Exercise
}

export type ExerciseWithSettings = Omit<ProgramExercise, 'programId'>

export interface CompleteExercise extends ExerciseWithSettings {
  exercise?: Exercise
}

export interface CompletePatientProgram extends PatientProgram {
  programExercise: ProgramExercise[]
}

export type PatientForm = z.infer<typeof PatientFormSchema>

export type PatientProgramForm = z.infer<typeof PatientProgramFormSchema>

export type Role = z.infer<typeof RoleEnum>

export type SessionDataComplete = PatientSession & {
  program: Pick<PatientProgram, 'name'>
} & {
  sessionExercise: (Pick<SessionExercise, 'id'> & {
    exercise: Pick<Exercise, 'id' | 'displayName' | 'direction'>
  })[]
}

export const ProgramStatus = {
  START: 'started',
  PAUSE: 'paused',
  END: 'ready',
} as const

export type ProgramStatus = (typeof ProgramStatus)[keyof typeof ProgramStatus]

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

export type ProgramEvent = keyof typeof PROGRAM_EVENT

export const SYSTEM_EVENT = {
  NotifyDoctor: 'onNotifyDoctor',
} as const

export type SystemEventKey = keyof typeof SYSTEM_EVENT

export const CONNECTION_EVENT = {
  CONNECTION: 'connection',
  DISCONNECTION: 'disconnect',
  ERROR: 'onError',
  DEVICE_STATUS: 'onDeviceStatus',
} as const

export type ConnectionEventKey = keyof typeof CONNECTION_EVENT

/** WebRTC signaling for VR casting: console requests offer, VR sends offer, console sends answer. */
export const CASTING_EVENT = {
  RequestOffer: { name: 'onRequestOffer', payload: false },
  Offer: { name: 'onOffer', payload: true },
  Answer: { name: 'onAnswer', payload: true },
} as const

export type CastingEventKey = keyof typeof CASTING_EVENT

export type WarmupPayload = {
  settings: VRPayloadSettings
}

export type VRPayloadSettings = {
  avatarId: string
  sessionNumber: number
  mapId: string
  language?: Patient['language']
}

export type ProgramStartPayload = {
  exerciseData: ExerciseData[]
  settings: VRPayloadSettings
}

export type ExerciseData = Omit<ProgramExercise, 'exerciseId' | 'programId'>

export type VRDevice = {
  data: Device
  socket: SocketWithQuery
  mutations: {
    setDeviceRoomCode: (roomCode: string) => void
    clearDeviceRoomCode: () => void
  }
  events: {
    programStart: (payload: ProgramStartPayload) => void
    programPause: () => void
    programEnd: () => void
    startWarmup: (payload: WarmupPayload) => void
    endWarmup: () => void
    settingsChange: (payload: ExerciseData) => void
    changeExercise: (payload: string) => void
    calibrateHeight: () => void
    resetPosition: () => void
    sittingChange: (payload: boolean) => void
    gameLoad: (payload: { avatarId: number }) => void
    gameStart: () => void
    gameEnd: () => void
  }
}

export const ROOM_EVENT = {
  MemberLeft: 'memberLeft',
  RoomComplete: 'roomComplete',
  RoomJoined: 'roomJoined',
} as const

export type RoomEvent = keyof typeof ROOM_EVENT

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

export type GameEvent = keyof typeof GAME_EVENT

export const IMAGE_TYPE = {
  'image/jpeg': '.jpeg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const

export type ImageType = keyof typeof IMAGE_TYPE

export type FormError<T> = {
  [Key in keyof T]?: string | string[]
}

export type DeviceForm = Pick<Device, 'name' | 'model'>

export type ProgressData = z.infer<typeof ProgressDataSchema>

export type PatientLocalData = {
  lastHeadset: Device['id']
  lastProgram: PatientProgram['id']
  lastAvatar: Avatar['id']
  lastMap: Map['id']
}

export type UserLocalData = {
  newUser: boolean
  device: boolean
  patient: boolean
  program: boolean
  dashboardSuggestionSidebar: boolean
  dashboardSuggestionDropdown: boolean
}

export type ProgressDataPoint =
  | {
      rep: number
      [key: string]: number
    }
  | { [key: string]: number }

export interface PresetWithExercises extends Preset {
  presetExercise: PresetExercise[]
}

export type PresetForm = z.infer<typeof PresetFormSchema>

export type PrismaJSONtoSTR<T, R> = Omit<T, keyof R> & R

export interface ExtendedPatientSession extends PatientSession {
  sessionExercise: SessionExercise[]
  sessionData: SessionData[]
}

export type MedHistoryDeltas = {
  anamnesesDeltas: Delta | null
  complaintsDeltas: Delta | null
  expectationsDeltas: Delta | null
  diagnosisDeltas: Delta | null
}

export type BodyAreas = {
  front: HumanState | null
  back: HumanState | null
}

export type BugReportForm = z.infer<typeof BugReportFormSchema>

export interface SocketWithQuery extends Socket {
  io: {
    opts: {
      query: { roomCode: string }
    } & Socket['io']['opts']
  } & Socket['io']
}
