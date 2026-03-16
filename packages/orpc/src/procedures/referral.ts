import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const listReferralCodes = authed
  .route({ path: '/referral/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context
    return prisma.referralCode.findMany({
      orderBy: { id: 'desc' },
    })
  })

const createReferralCode = authed
  .route({ path: '/referral/create', method: 'POST' })
  .handler(async ({ context }) => {
    const { prisma } = context

    async function codeExists(code: string): Promise<boolean> {
      const existing = await prisma.referralCode.findFirst({
        where: { code },
      })
      return !!existing
    }

    async function generateUniqueCode(): Promise<string> {
      let code = generateCode()
      let attempts = 0
      const maxAttempts = 100

      while (await codeExists(code)) {
        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique code after maximum attempts')
        }
        code = generateCode()
        attempts++
      }
      return code
    }

    const code = await generateUniqueCode()
    return prisma.referralCode.create({
      data: {
        code,
        usedAt: null,
        usedBy: null,
      },
    })
  })

const deleteReferralCode = authed
  .route({ path: '/referral/delete', method: 'DELETE' })
  .input(z.object({ id: z.number() }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    await prisma.referralCode.delete({
      where: { id: input.id },
    })
  })

export const referral = {
  list: listReferralCodes,
  create: createReferralCode,
  delete: deleteReferralCode,
}
