import {
  Avatar,
  Exercise,
  Map,
  PatientSession,
  SessionExercise,
  Device,
  ReusableProgram,
  ReusableProgramExercise,
  SessionData,
} from '@virtality/db'
import { Delta } from 'quill'
import { HumanState } from '@/data/static/human-body'
import { Socket } from 'socket.io-client'
import type { DeviceEmitter } from '@/lib/device-event-controller'

export type ExerciseWithSettings = Pick<
  SessionExercise,
  'id' | 'exerciseId' | 'sets' | 'reps' | 'restTime' | 'holdTime' | 'speed'
> & {
  romMode: 0 | 1
}

export interface CompleteExercise extends ExerciseWithSettings {
  exercise?: Exercise
}

export interface CompleteReusableProgram extends ReusableProgram {
  exercises: ReusableProgramExercise[]
}

export const ProgramStatus = {
  START: 'started',
  PAUSE: 'paused',
  END: 'ready',
  LAUNCHING: 'launching',
} as const

export type ProgramStatus = (typeof ProgramStatus)[keyof typeof ProgramStatus]

export type VRDevice = {
  data: Device
  socket: SocketWithQuery
  mutations: {
    setDeviceRoomCode: (roomCode: string) => void
    clearDeviceRoomCode: () => void
  }
  events: DeviceEmitter
}

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

export type PatientLocalData = {
  lastHeadset: Device['id']
  lastProgram: ReusableProgram['id']
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

export interface SocketWithQuery extends Socket {
  io: {
    opts: {
      query: { roomCode: string }
    } & Socket['io']['opts']
  } & Socket['io']
}
