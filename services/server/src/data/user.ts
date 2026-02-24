import { prisma } from '@virtality/db'
import type { User } from '@virtality/db'

export async function updateUserRole(userId: string, role: User['role']) {
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })
}
