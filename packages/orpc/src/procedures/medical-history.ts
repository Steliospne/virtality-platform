import {
  MedicalHistoryFindFirstZodSchema,
  MedicalHistoryFindManyZodSchema,
  MedicalHistorySchema,
} from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'

const listMedicalHistory = authed
  .route({ path: '/medicalHistory/list', method: 'GET' })
  .input(MedicalHistoryFindManyZodSchema.optional())
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const medicalHistory = await prisma.medicalHistory.findMany({
      where: { patientId: input?.where?.patientId },
      take: input?.take,
      skip: input?.skip,
      cursor: input?.cursor,
      orderBy: input?.orderBy,
      select: input?.select,
    })

    return medicalHistory
  })

const findMedicalHistory = authed
  .route({ path: '/medicalHistory/:id', method: 'GET' })
  .input(MedicalHistoryFindFirstZodSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const medicalHistory = await prisma.medicalHistory.findFirst({
      where: { patientId: input?.where?.patientId },
      take: input?.take,
      skip: input?.skip,
      cursor: input?.cursor,
      orderBy: input?.orderBy,
      select: input?.select,
    })
    return medicalHistory
  })

const createMedicalHistory = authed
  .route({ path: '/medicalHistory/create', method: 'POST' })
  .input(MedicalHistorySchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const newMedicalHistory = await prisma.medicalHistory.create({
      data: input,
    })

    return newMedicalHistory
  })

const updateMedicalHistory = authed
  .route({ path: '/medicalHistory/update', method: 'PUT' })
  .input(MedicalHistorySchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const updatedMedicalHistory = await prisma.medicalHistory.update({
      where: { id: input.id },
      data: input,
    })
    return updatedMedicalHistory
  })

export const medicalHistory = {
  list: listMedicalHistory,
  find: findMedicalHistory,
  create: createMedicalHistory,
  update: updateMedicalHistory,
}
