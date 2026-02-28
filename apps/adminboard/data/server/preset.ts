'use server'
import { prisma } from '@virtality/db'
import type { Preset, PresetExercise } from '@virtality/db'
import { updatePresetExercises } from './preset-exercise'

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

export const createPreset = async (data: Preset) => {
  try {
    const preset = await prisma.preset.create({ data })

    return preset
  } catch (error) {
    console.log('Error creating preset', error)
  }
}

export const updatePreset = async ({
  data,
  exercises,
}: {
  data: Preset
  exercises: PresetExercise[]
}) => {
  try {
    const preset = await prisma.preset.update({ where: { id: data.id }, data })
    await updatePresetExercises(exercises)
    return preset
  } catch (error) {
    console.log('Error updating preset', error)
  }
}

export const deletePreset = async (id: Preset['id']) => {
  try {
    await prisma.preset.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  } catch (error) {
    console.log('Error deleting preset', error)
  }
}
