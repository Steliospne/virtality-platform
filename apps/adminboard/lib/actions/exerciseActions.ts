'use server'
import { ExerciseArraySchema } from '@/types/definitions'
import { prisma } from '@virtality/db'
import { Exercise } from '@virtality/db'
import { getUserAndSession } from './authActions'

export const getExercises = async () => {
  try {
    return await prisma.exercise.findMany({
      orderBy: { id: 'asc' }, // or 'desc' if you want newest first
    })
  } catch (error) {
    console.error(error)
  }
}

export const updateExercises = async (
  state: {
    validationErrors: string | null
    values: string | null
  },
  formData?: FormData,
) => {
  const session = await getUserAndSession()
  if (!session || !formData) return { validationErrors: null, values: null }

  const entries = Object.fromEntries(formData)
  const { inputs } = entries
  const data = JSON.parse(inputs as string)
  const validation = ExerciseArraySchema.safeParse(data)
  if (!validation.success)
    return {
      validationErrors: JSON.stringify(validation.error.issues),
      values: JSON.stringify(data),
    }
  data.array.forEach(async (element: Exercise) => {
    await prisma.exercise.update({
      where: {
        id: element.id,
      },
      data: element,
    })
  })

  return { validationErrors: null, values: null }
}
