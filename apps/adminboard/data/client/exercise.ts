import { Exercise } from '@virtality/db'

export const fetchExercises = async () => {
  const data = await fetch('/api/v1/exercises')

  const { exercises } = await data.json()

  return exercises as Exercise[]
}
