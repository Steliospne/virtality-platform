import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export type BucketListInput = {
  prefix?: string
  continuationToken?: string
}

export function useBucket(input?: BucketListInput) {
  const orpc = useORPC()

  return useQuery(
    orpc.bucket.list.queryOptions({
      input: {
        prefix: input?.prefix ?? '',
        continuationToken: input?.continuationToken,
      },
    }),
  )
}
