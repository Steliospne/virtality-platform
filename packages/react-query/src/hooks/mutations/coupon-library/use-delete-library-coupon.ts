import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useDeleteLibraryCoupon() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.couponLibrary.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.couponLibrary.list.key(),
        })
      },
    }),
  )
}
