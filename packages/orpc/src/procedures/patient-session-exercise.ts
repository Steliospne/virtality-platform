import { SessionExerciseSchema } from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'
import { z } from 'zod'
import { generateUUID } from '@virtality/shared/utils'

export const PatientSessionExercisesSchema = z.object({
  patientSessionId: z.string(),
  exercises: z.array(SessionExerciseSchema.omit({ id: true })),
})

const createPatientSessionExercises = authed
  .route({ path: '/patient-session-exercise/create', method: 'POST' })
  .input(PatientSessionExercisesSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const data = input.exercises.map((exercise) => ({
      ...exercise,
      id: generateUUID(),
    }))

    await prisma.sessionExercise.createMany({
      data,
    })
    return data.map((exercise) => exercise.id)
  })

export const patientSessionExercise = {
  createMany: createPatientSessionExercises,
}
