import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'
import { invalidateRenewTriggerList } from './invalidate-renew-trigger-list.js'

export function useUpdateRenewTrigger() {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.renewTrigger.update.mutationOptions({
      onSuccess: (data) => {
        invalidateRenewTriggerList(queryClient, orpc, data.channel)
      },
    }),
  )
}
