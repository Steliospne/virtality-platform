import { skipToken, useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

export function useBucketObjectDetails(objectKey: string | null) {
  const orpc = useORPC()

  return useQuery(
    orpc.bucket.details.queryOptions({
      input: objectKey ? { objectKey } : skipToken,
    }),
  )
}
