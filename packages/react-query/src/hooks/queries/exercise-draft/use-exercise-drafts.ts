import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useExerciseDrafts() {
  const orpc = useORPC()
  return useQuery(orpc.exerciseDraft.list.queryOptions())
}
