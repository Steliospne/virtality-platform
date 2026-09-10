import { z } from 'zod/v4'

export const exerciseDraftLateralitySchema = z.enum(['pair', 'single'])

export type ExerciseDraftLaterality = z.infer<
  typeof exerciseDraftLateralitySchema
>

export const exerciseDraftIdInputSchema = z.object({
  id: z.uuid(),
})

export const saveExerciseDraftInputSchema = z.object({
  id: z.uuid(),
  laterality: exerciseDraftLateralitySchema.nullable().optional(),
  displayName: z.string().optional(),
  unityStem: z.string().optional(),
  unityStemDirty: z.boolean().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  item: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
})

export type SaveExerciseDraftInput = z.infer<
  typeof saveExerciseDraftInputSchema
>

export const checkExerciseDraftOccupancyInputSchema = z.object({
  draftId: z.uuid(),
  candidateNames: z.array(z.string()).optional(),
})

export const promoteExerciseDraftInputSchema = z.object({
  draftId: z.uuid(),
})

export type ExerciseDraftFields = {
  id: string
  createdBy: string
  laterality: ExerciseDraftLaterality | null
  displayName: string
  unityStem: string
  unityStemDirty: boolean
  description: string
  category: string
  item: string | null
  image: string | null
  video: string | null
}

export type ExerciseDraftWithTimestamps = ExerciseDraftFields & {
  createdAt: Date
  updatedAt: Date
}
