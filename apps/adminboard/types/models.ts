import z from 'zod/v4'
import {
  LoginFormSchema,
  NewUserFormSchema,
  PresetFormSchema,
} from './definitions'
import { Preset, PresetExercise } from '@virtality/db'

export type FormError<T> = {
  [K in keyof T]?: string | string[]
}

export type LoginForm = z.infer<typeof LoginFormSchema>

export type NewUserForm = z.infer<typeof NewUserFormSchema>

export type PresetForm = z.infer<typeof PresetFormSchema>

export interface PresetWithExercises extends Preset {
  presetExercise: PresetExercise[]
}

export type Image = {
  imageURL: string
  key: string | undefined
}

export const IMAGE_TYPE = {
  'image/jpeg': '.jpeg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const

export type ImageType = keyof typeof IMAGE_TYPE
