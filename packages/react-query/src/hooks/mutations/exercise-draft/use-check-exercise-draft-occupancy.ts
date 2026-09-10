import { useMutation } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCheckExerciseDraftOccupancy() {
  const orpc = useORPC()
  return useMutation(orpc.exerciseDraft.checkOccupancy.mutationOptions())
}
