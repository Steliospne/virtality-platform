'use server'
import { prisma } from '@virtality/db'

export const getUsers = async () => {
  try {
    const users = await prisma.user.findMany()
    return { data: { users, total: users.length ?? 0 } }
  } catch (error) {
    console.error(error)
  }
}
