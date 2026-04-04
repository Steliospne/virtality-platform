import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'
import { ExerciseFindManyZodSchema } from '@virtality/db/definitions'

const listExercise = authed
  .route({ path: '/exercise/list', method: 'GET' })
  .input(
    ExerciseFindManyZodSchema.extend({
      includeDisabled: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const { includeDisabled, orderBy, where } = input

    return prisma.exercise.findMany({
      where: { ...where, ...(!includeDisabled && { enabled: true }) },
      orderBy: orderBy ?? { id: 'asc' },
    })
  })

const listExerciseCategories = authed
  .route({ path: '/exercise/categories', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context

    const rows = await prisma.exercise.findMany({
      where: { enabled: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return rows.map((row) => row.category)
  })

export const exercise = {
  list: listExercise,
  listCategories: listExerciseCategories,
}
