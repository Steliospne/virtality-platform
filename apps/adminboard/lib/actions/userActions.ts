'use server'
import { prisma } from '@virtality/db'
import { UserArraySchema } from '@/types/definitions'
import { User } from '@virtality/db'
import { getUserAndSession } from './authActions'

export const updateUsers = async (
  state: {
    validationErrors: string | null
    values: string | null
  },
  formData?: FormData,
) => {
  const sesData = await getUserAndSession()
  if (!sesData || !formData) return { validationErrors: null, values: null }

  const entries = Object.fromEntries(formData)
  const { inputs } = entries
  const data = JSON.parse(inputs as string)
  const validation = UserArraySchema.safeParse(data)
  if (!validation.success)
    return {
      validationErrors: JSON.stringify(validation.error.issues),
      values: JSON.stringify(data),
    }
  data.array.forEach(async (element: User) => {
    await prisma.user.update({
      where: {
        id: element.id,
      },
      data: element,
    })
  })

  return { validationErrors: null, values: null }
}
