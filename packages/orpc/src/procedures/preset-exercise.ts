import { PresetExerciseSchema } from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'
import { z } from 'zod'
import { diffById } from '@virtality/shared/utils'

export const PresetExercisesSchema = z.object({
  presetId: z.string(),
  exercises: z.array(PresetExerciseSchema),
})

const createPresetExercise = authed
  .route({ path: '/preset-exercise/create', method: 'POST' })
  .input(PresetExercisesSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    await prisma.presetExercise.createMany({
      data: input.exercises,
    })
  })

const updatePresetExercise = authed
  .route({ path: '/preset-exercise/update', method: 'PUT' })
  .input(PresetExercisesSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const prevExercises = await prisma.presetExercise.findMany({
      where: { presetId: input.presetId },
    })

    const {
      toDelete: exercisesToDelete,
      toCreate: exercisesToCreate,
      toUpdate: exercisesToUpdate,
    } = diffById(prevExercises, input.exercises)

    await prisma.$transaction(async () => {
      if (exercisesToDelete.length > 0) {
        await prisma.presetExercise.deleteMany({
          where: { id: { in: exercisesToDelete.map((ex) => ex.id) } },
        })
      }

      if (exercisesToCreate.length > 0) {
        await prisma.presetExercise.createMany({
          data: exercisesToCreate,
        })
      }

      if (exercisesToUpdate.length > 0) {
        for (const ex of exercisesToUpdate) {
          await prisma.presetExercise.update({
            where: { id: ex.id },
            data: ex,
          })
        }
      }
    })
  })

export const presetExercise = {
  createMany: createPresetExercise,
  updateMany: updatePresetExercise,
}
