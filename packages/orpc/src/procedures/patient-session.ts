import {
  PatientSessionFindFirstZodSchema,
  PatientSessionFindManyZodSchema,
  PatientSessionInputSchema,
  PatientSessionSchema,
} from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'

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

const completePatientSession = authed
  .route({ path: '/patient-session/complete', method: 'POST' })
  .input(PatientSessionSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const patientSession = await prisma.patientSession.update({
      where: { id: input.id },
      data: { completedAt: new Date() },
    })
    return patientSession
  })

export const patientSession = {
  list: listPatientSessions,
  find: findPatientSession,
  create: createPatientSession,
  update: updatePatientSession,
  delete: deletePatientSession,
  complete: completePatientSession,
}
