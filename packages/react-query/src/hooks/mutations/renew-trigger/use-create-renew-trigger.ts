import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { invalidateRenewTriggerList } from './invalidate-renew-trigger-list.js'

export function useCreateRenewTrigger() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.renewTrigger.create.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateRenewTriggerList(queryClient, orpc, variables.channel)
      },
    }),
  )
}
