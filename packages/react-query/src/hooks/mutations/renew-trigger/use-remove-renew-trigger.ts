import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RenewTriggerChannel } from '@virtality/shared/types'
import { useORPC } from '../../../orpc-context.js'
import { invalidateRenewTriggerList } from './invalidate-renew-trigger-list.js'

export function useRemoveRenewTrigger(channel: RenewTriggerChannel) {
  const orpc = useORPC()
  const queryClient = useQueryClient()

  return useMutation(
    orpc.renewTrigger.remove.mutationOptions({
      onSuccess: () => {
        invalidateRenewTriggerList(queryClient, orpc, channel)
      },
    }),
  )
}
