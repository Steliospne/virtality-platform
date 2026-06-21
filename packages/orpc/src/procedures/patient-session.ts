import {
  PatientSessionFindFirstZodSchema,
  PatientSessionFindManyZodSchema,
  PatientSessionSchema,
  SessionExerciseSchema,
} from '@virtality/db/definitions'
import { SessionCompletionSaveChoice } from '@virtality/shared/utils'
import { authed } from '../middleware/auth.ts'
import { z } from 'zod'
import { completePatientSessionWithSaveChoice } from './session-completion.ts'
import { createPatientSessionFromAck } from './session-start-from-ack.ts'
import { interruptPatientSession } from './session-interruption.ts'
import { syncSessionWorkingCopy } from './session-working-copy.ts'

const StartPatientSessionFromAckSchema = z.object({
  session: PatientSessionSchema,
  exercises: z.array(
    SessionExerciseSchema.omit({ patientSessionId: true }).extend({
      patientSessionId: z.string().optional(),
    }),
  ),
})

const listPatientSessions = authed
  .route({ path: '/patient-session/list', method: 'GET' })
  .input(PatientSessionFindManyZodSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const patientSessions = await prisma.patientSession.findMany({
      where: {
        patientId: input?.where?.patientId,
        AND: [{ deletedAt: null }],
        ...input.where,
      },
      take: input.take,
      skip: input.skip,
      cursor: input.cursor,
      orderBy: input.orderBy,
      include: { sessionData: true, sessionExercise: true },
    })
    return patientSessions
  })

const findPatientSession = authed
  .route({ path: '/patient-session/find', method: 'GET' })
  .input(PatientSessionFindFirstZodSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const patientSession = await prisma.patientSession.findFirst({
      where: {
        ...input.where,
        id: input.where?.id,
        AND: [{ deletedAt: null }],
      },
      orderBy: input.orderBy,
      cursor: input.cursor,
      take: input.take,
      skip: input.skip,
      include: { sessionData: true, sessionExercise: true },
    })
    return patientSession
  })

const createPatientSession = authed
  .route({ path: '/patient-session/create', method: 'POST' })
  .input(PatientSessionSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const patientSession = await prisma.patientSession.create({
      data: input,
    })
    return patientSession
  })

const updatePatientSession = authed
  .route({ path: '/patient-session/update', method: 'PUT' })
  .input(PatientSessionSchema.partial())
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const patientSession = await prisma.patientSession.update({
      where: { id: input.id },
      data: input,
    })
    return patientSession
  })

const deletePatientSession = authed
  .route({ path: '/patient-session/delete', method: 'DELETE' })
  .input(PatientSessionSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const patientSession = await prisma.patientSession.update({
      where: { id: input.id },
      data: { deletedAt: new Date() },
    })
    return patientSession
  })

const startPatientSessionFromAck = authed
  .route({ path: '/patient-session/start-from-ack', method: 'POST' })
  .input(StartPatientSessionFromAckSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    return prisma.$transaction(async (tx) =>
      createPatientSessionFromAck(
        {
          patientSession: tx.patientSession,
          sessionExercise: tx.sessionExercise,
        },
        input,
      ),
    )
  })

const CompletePatientSessionSchema = z.object({
  id: z.string(),
  saveChoice: z
    .enum([
      SessionCompletionSaveChoice.FINISH_ONLY,
      SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM,
      SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM,
    ])
    .default(SessionCompletionSaveChoice.FINISH_ONLY),
  newProgramName: z.string().optional(),
  notes: z.string().optional().nullable(),
  exercises: z
    .array(
      SessionExerciseSchema.omit({ patientSessionId: true }).extend({
        patientSessionId: z.string().optional(),
      }),
    )
    .optional(),
})

const completePatientSession = authed
  .route({ path: '/patient-session/complete', method: 'POST' })
  .input(CompletePatientSessionSchema)
  .handler(async ({ context, input }) => {
    const { prisma, user } = context

    return completePatientSessionWithSaveChoice(
      {
        patientSession: prisma.patientSession,
        sessionExercise: prisma.sessionExercise,
        reusableProgram: prisma.reusableProgram,
        reusableProgramExercise: prisma.reusableProgramExercise,
      },
      user.id,
      input,
    )
  })

const InterruptPatientSessionSchema = z.object({
  id: z.string(),
})

const interruptSession = authed
  .route({ path: '/patient-session/interrupt', method: 'POST' })
  .input(InterruptPatientSessionSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    return interruptPatientSession(prisma.patientSession, input.id)
  })

const SyncSessionWorkingCopySchema = z.object({
  id: z.string(),
  exercises: z.array(
    SessionExerciseSchema.omit({ patientSessionId: true }).extend({
      patientSessionId: z.string().optional(),
    }),
  ),
})

const syncWorkingCopy = authed
  .route({ path: '/patient-session/sync-working-copy', method: 'POST' })
  .input(SyncSessionWorkingCopySchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    return syncSessionWorkingCopy(
      {
        patientSession: prisma.patientSession,
        sessionExercise: prisma.sessionExercise,
      },
      input,
    )
  })

export const patientSession = {
  list: listPatientSessions,
  find: findPatientSession,
  create: createPatientSession,
  startFromAck: startPatientSessionFromAck,
  update: updatePatientSession,
  delete: deletePatientSession,
  complete: completePatientSession,
  interrupt: interruptSession,
  syncWorkingCopy,
}
