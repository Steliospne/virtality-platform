import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type MoveBucketFolderMutationOptions = ReturnType<
  ORPCUtils['bucket']['folderMove']['mutationOptions']
>
type MoveBucketFolderOnSuccess = NonNullable<
  MoveBucketFolderMutationOptions['onSuccess']
>

interface UseMoveBucketFolderProps {
  onSuccess?: MoveBucketFolderOnSuccess
}

export function useMoveBucketFolder({
  onSuccess,
}: UseMoveBucketFolderProps = {}) {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.bucket.folderMove.mutationOptions({
      onSuccess: (...args) => {
        queryClient.invalidateQueries({ queryKey: orpc.bucket.list.key() })
        queryClient.invalidateQueries({
          queryKey: orpc.bucket.folderPreview.key(),
        })
        onSuccess?.(...args)
      },
    }),
  )
}
