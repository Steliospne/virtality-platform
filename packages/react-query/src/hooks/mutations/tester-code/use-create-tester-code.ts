import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCreateTesterCode() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.testerCode.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.testerCode.list.key(),
        })
      },
    }),
  )
}
