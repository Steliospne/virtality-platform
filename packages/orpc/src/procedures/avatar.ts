import { authed } from '../middleware/auth.ts'

const listAvatar = authed
  .route({ path: '/avatar/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context
    const avatars = await prisma.avatar.findMany()
    return avatars
  })

export const avatar = {
  list: listAvatar,
}
