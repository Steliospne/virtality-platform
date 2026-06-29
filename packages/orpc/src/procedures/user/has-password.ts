import { authed } from '../../middleware/auth.ts'

const hasPassword = authed
  .route({ path: '/user/has-password', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma, user } = context
    const result = await prisma.account.findFirst({
      where: { userId: user.id, providerId: 'credential' },
      select: { password: true },
    })

    return !!result?.password
  })

export default hasPassword
