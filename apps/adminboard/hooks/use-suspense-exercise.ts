'use client'

import { fetchExercises } from '@/data/client/exercise'
import { useSuspenseQuery } from '@tanstack/react-query'

const useSuspenseExercise = () => {
  const { data, isPending } = useSuspenseQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    staleTime: 'static',
  })
  return { data, isPending }
}
export default useSuspenseExercise
