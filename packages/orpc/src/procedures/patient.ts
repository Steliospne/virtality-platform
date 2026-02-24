import { z } from 'zod/v4'
import {
  PatientFindManyZodSchema,
  PatientSchema,
  MedicalHistorySchema,
} from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'
import { generateImageFile } from '@virtality/shared/utils'
import { CDN_URL } from '../lib/const.ts'

const CombinedPatientSchema = z.object({
  data: z.object({
    patient: PatientSchema.omit({ userId: true, image: true }).extend({
      image: z.instanceof(File).or(z.string()).nullable().optional(),
    }),
    medicalHistory: MedicalHistorySchema,
  }),
})

const listPatients = authed
  .route({ path: '/patient/list', method: 'GET', inputStructure: 'detailed' })
  .input(PatientFindManyZodSchema.optional())
  .handler(async ({ context, input }) => {
    const { prisma, user } = context
    const patients = await prisma.patient.findMany({
      where: { userId: user.id, AND: [{ deletedAt: null }], ...input?.where },
      take: input?.take,
      skip: input?.skip,
      cursor: input?.cursor,
      orderBy: input?.orderBy,
      select: input?.select,
    })
    return patients
  })

const findPatient = authed
  .route({ path: '/patient/:id', method: 'GET' })
  .input(PatientSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma, user } = context
    const patient = await prisma.patient.findUnique({
      where: { id: input.id, userId: user.id },
    })
    return patient
  })

const createPatient = authed
  .route({ path: '/patient', method: 'POST' })
  .input(CombinedPatientSchema)
  .handler(async ({ context, input }) => {
    const { prisma, user, s3 } = context
    const { data } = input

    const newMedicalHistory = {
      ...data.medicalHistory,
      patientId: data.patient.id,
    }

    // TODO#1
    // After the refactor handle potential error cases.

    if (!data.patient.image || typeof data.patient.image === 'string') {
      const patient = await prisma.patient.create({
        data: {
          ...data.patient,
          userId: user.id,
          image: data.patient.image ?? null,
        },
      })
      await prisma.medicalHistory.create({ data: newMedicalHistory })

      return patient
    }

    const file = await generateImageFile({
      image: data.patient.image,
      resource: 'patient',
    })

    const res = await s3.uploadFile({
      Body: file?.buffer,
      ContentType: file?.ContentType,
      Key: file?.Key,
    })

    const newPatient = {
      ...data.patient,
      userId: user.id,
      image: `${CDN_URL}/${file?.Key}`,
    }

    const patient = await prisma.patient.create({ data: newPatient })
    await prisma.medicalHistory.create({ data: newMedicalHistory })

    return patient
  })

const deletePatient = authed
  .route({ path: '/patient/:id', method: 'DELETE' })
  .input(PatientSchema.pick({ id: true }))
  .handler(async ({ context, input }) => {
    const { prisma, user, s3 } = context
    const { id } = input
    const patient = await prisma.patient.findUnique({
      where: { id, userId: user.id },
    })
    if (!patient) throw new Error('Patient not found')

    if (patient.image) {
      let Key = patient.image
      const cdnUrlWithSlash = `${CDN_URL}/`
      if (Key.startsWith(cdnUrlWithSlash)) {
        Key = Key.slice(cdnUrlWithSlash.length)
      }
      await s3.deleteFile({ Key })
    }

    await prisma.patient.delete({ where: { id, userId: user.id } })
    return patient
  })

const updatePatient = authed
  .route({ path: '/patient/:id', method: 'PUT' })
  .input(CombinedPatientSchema)
  .handler(async ({ context, input }) => {
    const { prisma, user, s3 } = context
    const { data } = input

    // Retrieve the previous patient to compare current and new images
    const prevPatient = await prisma.patient.findUnique({
      where: { id: data.patient.id, userId: user.id },
    })
    if (!prevPatient) throw new Error('Patient not found')

    let imageField: string | null | undefined = undefined

    // Handle the change in image
    if ('image' in data.patient) {
      if (data.patient.image === undefined) {
        // No change, keep the current image value
        imageField = undefined
      } else if (data.patient.image === null) {
        // Remove the image if one was present before
        if (prevPatient.image) {
          let Key = prevPatient.image
          const cdnUrlWithSlash = `${CDN_URL}/`
          if (Key.startsWith(cdnUrlWithSlash)) {
            Key = Key.slice(cdnUrlWithSlash.length)
          }
          await s3.deleteFile({ Key })
        }
        imageField = null
      } else if (typeof data.patient.image === 'string') {
        // Same image string as before, no need to change
        imageField = undefined
      } else {
        const file = await generateImageFile({
          image: data.patient.image,
          resource: 'patient',
        })

        const res = await s3.uploadFile({
          Body: file?.buffer,
          ContentType: file?.ContentType,
          Key: file?.Key,
        })

        imageField = `${CDN_URL}/${file?.Key}`
      }
    }

    // Prepare the updated patient data, omitting undefined so Prisma keeps existing value
    const updateData = {
      ...data.patient,
      image: imageField,
    }

    const patient = await prisma.patient.update({
      where: { id: data.patient.id },
      data: updateData,
    })
  })

export const patient = {
  list: listPatients,
  find: findPatient,
  create: createPatient,
  delete: deletePatient,
  update: updatePatient,
}
