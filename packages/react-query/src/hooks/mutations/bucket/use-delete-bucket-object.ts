import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type DeleteBucketMutationOptions = ReturnType<
  ORPCUtils['bucket']['delete']['mutationOptions']
>
type DeleteBucketOnSuccess = NonNullable<
  DeleteBucketMutationOptions['onSuccess']
>

interface UseDeleteBucketObjectProps {
  onSuccess?: DeleteBucketOnSuccess
}

export function useDeleteBucketObject({
  onSuccess,
}: UseDeleteBucketObjectProps = {}) {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.bucket.delete.mutationOptions({
      onSuccess: (...args) => {
        queryClient.invalidateQueries({ queryKey: orpc.bucket.list.key() })
        onSuccess?.(...args)
      },
    }),
  )
}
