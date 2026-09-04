'use server'
import { UserSchema } from './definitions'
import { User } from '@/auth-client'
import { prisma } from '@virtality/db'
import { getUser } from './authActions'

// USER ACTIONS
export const updateUserAction = async (
  state: { data: User | null } | undefined,
  formData?: FormData,
) => {
  if (!formData) return state
  const oldUser = await getUser()
  const updatedUser = Object.fromEntries(formData) as unknown as User

  const newUser = {
    ...oldUser,
    ...updatedUser,
  }

  const validatedData = UserSchema.safeParse(newUser)
  // TODO make the update action more efficient by only updating the field changed
  // instead of rewriting the user
  if (!validatedData.success)
    return {
      data: updatedUser,
    }

  if (validatedData.success) {
    await prisma.user.update({
      where: { id: validatedData.data.id },
      data: validatedData.data,
    })
    return { data: newUser }
  }
}
