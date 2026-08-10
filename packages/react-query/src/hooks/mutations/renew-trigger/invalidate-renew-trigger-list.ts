import type { QueryClient } from '@tanstack/react-query'
import type { RenewTriggerChannel } from '@virtality/shared/types'
import type { ORPCUtils } from '../../../orpc.js'

export function invalidateRenewTriggerList(
  queryClient: QueryClient,
  orpc: ORPCUtils,
  channel: RenewTriggerChannel,
) {
  return queryClient.invalidateQueries({
    queryKey: orpc.renewTrigger.list.key({ input: { channel } }),
  })
}
