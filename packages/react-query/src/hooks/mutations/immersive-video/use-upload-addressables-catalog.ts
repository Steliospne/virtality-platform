import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useUploadAddressablesCatalog() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  return useMutation(
    orpc.immersiveVideo.addressablesCatalog.upload.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: orpc.immersiveVideo.addressablesCatalog.list.key(),
        }),
    }),
  )
}
