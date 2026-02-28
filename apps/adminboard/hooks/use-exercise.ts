'use client'

import { fetchExercises } from '@/data/client/exercise'
import { useQuery } from '@tanstack/react-query'

const useExerciseList = () => {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    staleTime: 'static',
  })
}
export default useExerciseList
