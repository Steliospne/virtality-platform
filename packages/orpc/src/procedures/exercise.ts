import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'

const ExerciseListInputSchema = z
  .object({
    includeDisabled: z.boolean().optional(),
  })
  .optional()

const listExercise = authed
  .route({ path: '/exercise/list', method: 'GET' })
  .input(ExerciseListInputSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const includeDisabled = input?.includeDisabled === true
    return prisma.exercise.findMany({
      where: includeDisabled ? undefined : { enabled: true },
      orderBy: { id: 'asc' },
    })
  })

export const exercise = {
  list: listExercise,
}
