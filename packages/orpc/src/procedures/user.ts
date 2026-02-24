import { UserSchema } from '@virtality/db/definitions'
import { authed } from '../middleware/auth.ts'
import { base } from '../context.ts'

const isUserVerified = base
  .route({ path: '/user/is-verified', method: 'GET' })
  .input(UserSchema.pick({ email: true }))
  .handler(async ({ context, input }) => {
    const { prisma } = context
    const result = await prisma.user.findUnique({
      where: { email: input.email, AND: [{ deletedAt: null }] },
      select: { emailVerified: true },
    })
    return result?.emailVerified
  })

const findUserName = authed
  .route({ path: '/user/find-name', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma, user } = context
    const result = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    })
    return result?.name
  })

export const user = {
  isUserVerified,
  findUserName,
}
