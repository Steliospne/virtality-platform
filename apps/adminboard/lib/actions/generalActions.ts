'use server'
import { virtalityS3 } from '@virtality/orpc/s3'
import { FormError } from '@/types/models'
import { randomImageName } from '@/lib/utils'
import { prisma } from '@virtality/db'
import { getUserAndSession } from './authActions'

export const uploadFileAction = async (
  state: {
    validationErrors: FormError<File> | null
    values: Partial<File> | string | null
  },
  formData?: FormData,
) => {
  const session = await getUserAndSession()
  if (!session || !formData) return { validationErrors: null, values: null }

  const entries = Object.fromEntries(formData)

  const { typeName, itemId, image } = entries as {
    typeName: string
    itemId: string
    image: File
  }
  const imageUrl = image.size !== 0 ? randomImageName() + '_' + typeName : null

  if (imageUrl) {
    let prevImageKey
    switch (typeName) {
      case 'Exercise':
        prevImageKey = await prisma.exercise
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image)
        await virtalityS3.deleteFile({
          Key: prevImageKey!,
        })
        await prisma.exercise.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        })
        break
      case 'User':
        prevImageKey = await prisma.user
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image)
        await virtalityS3.deleteFile({
          Key: prevImageKey!,
        })
        await prisma.user.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        })
        break
      case 'Map':
        prevImageKey = await prisma.map
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image)
        await virtalityS3.deleteFile({
          Key: prevImageKey!,
        })
        await prisma.map.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        })
        break
      case 'Avatar':
        prevImageKey = await prisma.avatar
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image)
        await virtalityS3.deleteFile({
          Key: prevImageKey!,
        })
        await prisma.avatar.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        })
        break
      case 'Patient':
        prevImageKey = await prisma.patient
          .findUnique({
            where: { id: itemId },
          })
          .then((res) => res?.image)
        await virtalityS3.deleteFile({
          Key: prevImageKey!,
        })
        await prisma.patient.update({
          where: {
            id: itemId,
          },
          data: { image: imageUrl },
        })
        break
    }
    const imageFile = image
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    await virtalityS3.uploadFile({
      Body: buffer,
      ContentType: imageFile.type,
      Key: imageUrl,
    })
  }
  return { validationErrors: null, values: imageUrl }
}
