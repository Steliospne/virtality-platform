import { PresetWithExercises } from '@/types/models'
import { Preset } from '@virtality/db'

export const fetchPresets = async () => {
  const data = await fetch(`/api/v1/presets`)
  const { presets } = await data.json()
  return presets as Preset[]
}

export const fetchPresetById = async (id: string) => {
  const data = await fetch(`/api/v1/presets/${id}`)
  const { preset } = await data.json()
  return preset as PresetWithExercises
}
