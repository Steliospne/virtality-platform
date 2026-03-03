import { WaitlistSchema } from '@virtality/shared/types'
import { generateUUID } from '@virtality/shared/utils'
import { base } from '../context.ts'

const listWaitlist = base
  .route({ path: '/waitlist/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context
    const waitlist = await prisma.waitingList.findMany({
      where: {
        AND: [{ deletedAt: null }],
      },
    })
    return waitlist
  })

const createWaitlist = base
  .route({ path: '/waitlist/create', method: 'POST' })
  .input(WaitlistSchema)
  .handler(async ({ context, input }) => {
    const { prisma } = context

    const exists = await prisma.waitingList.findFirst({
      where: { email: input.email },
    })

    if (exists) {
      return { success: false, message: 'You are already on the waitlist.' }
    }

    await prisma.waitingList.create({
      data: {
        id: generateUUID(),
        ...input,
        createdAt: new Date(),
      },
    })

    return { success: true, message: null }
  })

export const waitlist = {
  list: listWaitlist,
  create: createWaitlist,
}
