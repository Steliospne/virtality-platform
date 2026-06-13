import { SessionDataSchema } from '@virtality/db/definitions'
import { generateUUID } from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { z } from 'zod'
import { upsertSessionProgressRecords } from './session-progress-data.ts'

const SessionProgressUpsertSchema = z.object({
  patientSessionId: z.string(),
  sessionExerciseId: z.string(),
  value: z.string(),
})

const createPatientSessionData = authed
  .route({ path: '/patient-session-data/create', method: 'POST' })
  .input(z.array(SessionDataSchema))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    await prisma.sessionData.createMany({
      data: input,
    })
  })

const upsertPatientSessionData = authed
  .route({ path: '/patient-session-data/upsert-many', method: 'PUT' })
  .input(z.array(SessionProgressUpsertSchema))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    await upsertSessionProgressRecords(prisma, input, generateUUID)
  })

export const patientSessionData = {
  create: createPatientSessionData,
  upsertMany: upsertPatientSessionData,
}
