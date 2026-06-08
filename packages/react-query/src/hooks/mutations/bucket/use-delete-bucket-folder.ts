import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type DeleteBucketFolderMutationOptions = ReturnType<
  ORPCUtils['bucket']['folderDelete']['mutationOptions']
>
type DeleteBucketFolderOnSuccess = NonNullable<
  DeleteBucketFolderMutationOptions['onSuccess']
>

interface UseDeleteBucketFolderProps {
  onSuccess?: DeleteBucketFolderOnSuccess
}

export function useDeleteBucketFolder({
  onSuccess,
}: UseDeleteBucketFolderProps = {}) {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.bucket.folderDelete.mutationOptions({
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
