import { orpc } from '@/integrations/orpc/client'
import { useQuery } from '@tanstack/react-query'

const useExercise = () => {
  return useQuery(orpc.exercise.list.queryOptions({ staleTime: 'static' }))
}

export default useExercise
