import { z } from 'zod/v4'

export const exerciseDraftLateralitySchema = z.enum(['pair', 'single'])

export type ExerciseDraftLaterality = z.infer<
  typeof exerciseDraftLateralitySchema
>
