import { diffById } from '@virtality/shared/utils'
import { ProgramExerciseSchema } from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'
import { z } from 'zod'

export const ProgramExercisesSchema = z.object({
  programId: z.string(),
  exercises: z.array(ProgramExerciseSchema),
})

const createProgramExercise = authed
  .route({ path: '/program-exercise/create', method: 'POST' })
  .input(ProgramExercisesSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    await prisma.programExercise.createMany({
      data: input.exercises,
    })
  })

const updateProgramExercise = authed
  .route({ path: '/program-exercise/update', method: 'PUT' })
  .input(ProgramExercisesSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const prevExercises = await prisma.programExercise.findMany({
      where: { programId: input.programId },
    })

    const {
      toDelete: exercisesToDelete,
      toCreate: exercisesToCreate,
      toUpdate: exercisesToUpdate,
    } = diffById(prevExercises, input.exercises)

    await prisma.$transaction(async () => {
      if (exercisesToDelete.length > 0) {
        await prisma.programExercise.deleteMany({
          where: { id: { in: exercisesToDelete.map((ex) => ex.id) } },
        })
      }

      if (exercisesToCreate.length > 0) {
        await prisma.programExercise.createMany({
          data: exercisesToCreate,
        })
      }

      if (exercisesToUpdate.length > 0) {
        for (const ex of exercisesToUpdate) {
          await prisma.programExercise.update({
            where: { id: ex.id },
            data: ex,
          })
        }
      }
    })
  })

export const programExercise = {
  createMany: createProgramExercise,
  updateMany: updateProgramExercise,
}
