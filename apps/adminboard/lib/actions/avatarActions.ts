'use server'
import { prisma } from '@virtality/db'
import { AvatarArraySchema } from '@/types/definitions'
import { Avatar } from '@virtality/db'
import { getUserAndSession } from './authActions'

export const getAvatars = async () => {
  try {
    return await prisma.avatar.findMany({
      orderBy: { id: 'asc' },
    })
  } catch (error) {
    console.error(error)
  }
}

export const updateAvatars = async (
  state: {
    validationErrors: string | null
    values: string | null
  },
  formData?: FormData,
) => {
  const session = await getUserAndSession()
  if (!session || !formData) return { validationErrors: null, values: null }

  const entries = Object.fromEntries(formData)
  const { inputs } = entries
  const data = JSON.parse(inputs as string)
  const validation = AvatarArraySchema.safeParse(data)
  if (!validation.success)
    return {
      validationErrors: JSON.stringify(validation.error.issues),
      values: JSON.stringify(data),
    }
  data.array.forEach(async (element: Avatar) => {
    await prisma.avatar.update({
      where: {
        id: element.id,
      },
      data: element,
    })
  })

  return { validationErrors: null, values: null }
}
