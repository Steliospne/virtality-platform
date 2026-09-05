'use server'
import { prisma } from '@virtality/db'
import type { Preset } from '@virtality/db'

export const getPresets = async () => {
  try {
    const presets = await prisma.preset.findMany({ where: { userId: null } })
    return presets
  } catch (error) {
    console.log('Error getting presets', error)
  }
}

export const getPresetWithExercises = async (id: Preset['id']) => {
  try {
    const preset = await prisma.preset.findFirst({
      where: { id },
      include: { presetExercise: { where: { exercise: { enabled: true } } } },
    })
    return preset
  } catch (error) {
    console.log('Error getting preset', error)
  }
}

export const getPresetsByUser = async (userId: string) => {
  try {
    const presets = await prisma.preset.findMany({
      where: { userId, AND: [{ deletedAt: null }] },
      include: { presetExercise: true },
    })
    return presets
  } catch (error) {
    console.log('Error getting presets', error)
  }
}
