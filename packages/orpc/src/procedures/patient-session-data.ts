import { SessionDataSchema } from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'
import { z } from 'zod'

const createPatientSessionData = authed
  .route({ path: '/patient-session-data/create', method: 'POST' })
  .input(z.array(SessionDataSchema))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    await prisma.sessionData.createMany({
      data: input,
    })
  })

export const patientSessionData = {
  create: createPatientSessionData,
}
