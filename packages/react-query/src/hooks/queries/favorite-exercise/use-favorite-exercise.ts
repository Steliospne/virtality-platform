import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

export function useFavoriteExercise() {
  const orpc = useORPC()
  return useQuery(orpc.favoriteExercise.list.queryOptions())
}
