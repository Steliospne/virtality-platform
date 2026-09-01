import { hashPassword } from 'better-auth/crypto'
import type { PrismaClient } from '../generated/client.js'
import { DEV_ADMIN } from './dev-admin-constants.ts'

export async function seedDevAdmin(prisma: PrismaClient): Promise<string> {
  const now = new Date()
  const passwordHash = await hashPassword(DEV_ADMIN.password)

  await prisma.user.upsert({
    where: { email: DEV_ADMIN.email },
    create: {
      id: DEV_ADMIN.userId,
      name: DEV_ADMIN.name,
      email: DEV_ADMIN.email,
      emailVerified: true,
      role: DEV_ADMIN.role,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      name: DEV_ADMIN.name,
      emailVerified: true,
      role: DEV_ADMIN.role,
      updatedAt: now,
      deletedAt: null,
    },
  })

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: DEV_ADMIN.email },
  })

  const existingCredential = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  })

  if (existingCredential) {
    await prisma.account.update({
      where: { id: existingCredential.id },
      data: {
        password: passwordHash,
        updatedAt: now,
      },
    })
  } else {
    await prisma.account.create({
      data: {
        id: DEV_ADMIN.accountId,
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    })
  }

  return user.id
}
