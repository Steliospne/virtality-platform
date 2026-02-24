import { authed } from '../middleware/auth.ts'

const listExercise = authed
  .route({ path: '/exercise/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { prisma } = context
    const exercises = await prisma.exercise.findMany({
      where: { enabled: true },
    })
    return exercises
  })

export const exercise = {
  list: listExercise,
}
