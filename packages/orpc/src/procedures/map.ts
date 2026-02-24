import { authed } from '../middleware/auth.ts'

const listMap = authed
  .route({ path: '/map/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context
    const maps = await prisma.map.findMany()
    return maps
  })

export const map = {
  list: listMap,
}
