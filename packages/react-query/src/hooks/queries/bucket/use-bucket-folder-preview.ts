import { skipToken, useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.tsx'

export function useBucketFolderPreview(sourcePrefix: string | null) {
  const orpc = useORPC()

  return useQuery(
    orpc.bucket.folderPreview.queryOptions({
      input: sourcePrefix ? { sourcePrefix } : skipToken,
    }),
  )
}
