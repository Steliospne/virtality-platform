'use server'
import { prisma } from '@virtality/db'

export const getExercises = async () => {
  const exercises = await prisma.exercise.findMany({
    where: { enabled: true },
  })
  return exercises
}
