import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ORPCUtils } from '../../../orpc.js'
import { useORPC } from '../../../orpc-context.js'

type UploadBucketMutationOptions = ReturnType<
  ORPCUtils['bucket']['upload']['mutationOptions']
>
type UploadBucketOnSuccess = NonNullable<
  UploadBucketMutationOptions['onSuccess']
>

interface UseUploadBucketObjectsProps {
  onSuccess?: UploadBucketOnSuccess
}

export function useUploadBucketObjects({
  onSuccess,
}: UseUploadBucketObjectsProps = {}) {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.bucket.upload.mutationOptions({
      onSuccess: (...args) => {
        queryClient.invalidateQueries({ queryKey: orpc.bucket.list.key() })
        onSuccess?.(...args)
      },
    }),
  )
}
