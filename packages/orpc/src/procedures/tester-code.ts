import { z } from 'zod/v4'
import { authed } from '../middleware/auth.ts'

const TESTER_CODE_PREFIX = 'TE-'
const TESTER_CODE_BODY_LENGTH = 10

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let body = ''
  for (let i = 0; i < TESTER_CODE_BODY_LENGTH; i++) {
    body += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${TESTER_CODE_PREFIX}${body}`
}

const listTesterCodes = authed
  .route({ path: '/tester-code/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context
    return prisma.testerCode.findMany({
      orderBy: { id: 'desc' },
    })
  })

const createTesterCode = authed
  .route({ path: '/tester-code/create', method: 'POST' })
  .handler(async ({ context }) => {
    const { prisma } = context

    async function codeExists(code: string): Promise<boolean> {
      const existing = await prisma.testerCode.findFirst({
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
          throw new Error(
            'Failed to generate unique code after maximum attempts',
          )
        }
        code = generateCode()
        attempts++
      }
      return code
    }

    const code = await generateUniqueCode()
    return prisma.testerCode.create({
      data: {
        code,
        usedAt: null,
        usedBy: null,
      },
    })
  })

const deleteTesterCode = authed
  .route({ path: '/tester-code/delete', method: 'DELETE' })
  .input(z.object({ id: z.number() }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    await prisma.testerCode.delete({
      where: { id: input.id },
    })
  })

export const testerCode = {
  list: listTesterCodes,
  create: createTesterCode,
  delete: deleteTesterCode,
}
