import { PatientProgramSchema } from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'
import { generateUUID } from '@virtality/shared/utils'

const listProgram = authed
  .route({ path: '/program/list', method: 'GET' })
  .input(PatientProgramSchema.pick({ patientId: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const programs = await prisma.patientProgram.findMany({
      where: {
        patientId: input.patientId,
        AND: [{ deletedAt: null }],
      },
      include: { programExercise: true },
    })

    return programs
  })

const findProgram = authed
  .route({ path: '/program/find', method: 'GET' })
  .input(PatientProgramSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const program = await prisma.patientProgram.findFirst({
      where: { id: input.id, AND: [{ deletedAt: null }] },
      include: { programExercise: true },
    })
    return program
  })

const createProgram = authed
  .route({ path: '/program/create', method: 'POST' })
  .input(PatientProgramSchema.pick({ patientId: true, name: true }))
  .handler(async ({ context, input }) => {
    const { prisma, user } = context

    const data = {
      id: generateUUID(),
      userId: user.id,
      name: input.name === '' ? 'untitled' : input.name,
      patientId: input.patientId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    const program = await prisma.patientProgram.create({
      data,
    })

    return program
  })

const updateProgram = authed
  .route({ path: '/program/update', method: 'PUT' })
  .input(PatientProgramSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const program = await prisma.patientProgram.update({
      where: { id: input.id },
      data: { ...input, updatedAt: new Date() },
    })
    return program
  })

const deleteProgram = authed
  .route({ path: '/program/delete', method: 'DELETE' })
  .input(PatientProgramSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const program = await prisma.patientProgram.update({
      where: { id: input.id },
      data: { deletedAt: new Date() },
    })
    return program
  })

export const program = {
  list: listProgram,
  find: findProgram,
  create: createProgram,
  update: updateProgram,
  delete: deleteProgram,
}
