import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useUpdateLibraryCouponName() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.couponLibrary.updateName.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.couponLibrary.list.key(),
        })
      },
    }),
  )
}
