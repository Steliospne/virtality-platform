import { skipToken, useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

export function useBucketObjectReferences(objectKey: string | null) {
  const orpc = useORPC()

  return useQuery(
    orpc.bucket.references.queryOptions({
      input: objectKey ? { objectKey } : skipToken,
    }),
  )
}
