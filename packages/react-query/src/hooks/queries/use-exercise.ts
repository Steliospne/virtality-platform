import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../orpc-context.js'

export interface UseExerciseInput {
  includeDisabled?: boolean
}

export function useExercise(input?: UseExerciseInput) {
  const orpc = useORPC()
  return useQuery(
    orpc.exercise.list.queryOptions({
      input: { ...input },
      staleTime: 'static',
    }),
  )
}
