import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../orpc-context.js'

export function useExerciseCategories() {
  const orpc = useORPC()

  return useQuery(
    orpc.exercise.listCategories.queryOptions({
      staleTime: 'static',
    }),
  )
}
