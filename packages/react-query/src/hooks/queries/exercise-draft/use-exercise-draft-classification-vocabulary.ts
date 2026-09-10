import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useExerciseDraftClassificationVocabulary() {
  const orpc = useORPC()
  return useQuery(
    orpc.exerciseDraft.listClassificationVocabulary.queryOptions(),
  )
}
