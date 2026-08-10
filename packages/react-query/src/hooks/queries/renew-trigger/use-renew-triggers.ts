import { useQuery } from '@tanstack/react-query'
import type { RenewTriggerChannel } from '@virtality/shared/types'
import { useORPC } from '../../../orpc-context.js'

export function useRenewTriggers(channel: RenewTriggerChannel) {
  const orpc = useORPC()
  return useQuery(orpc.renewTrigger.list.queryOptions({ input: { channel } }))
}
