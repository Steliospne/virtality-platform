import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useExerciseDraft(id: string | undefined) {
  const orpc = useORPC()
  return useQuery(
    orpc.exerciseDraft.get.queryOptions({
      input: { id: id ?? '' },
      enabled: Boolean(id),
    }),
  )
}
