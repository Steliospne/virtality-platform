import { useQuery } from '@tanstack/react-query'
import type { TrialRedeemDisplayStatus } from '@virtality/shared/utils'
import { useORPC } from '../../../orpc-context.js'

export function useTrialRedeemCodes(
  displayStatuses?: TrialRedeemDisplayStatus[],
) {
  const orpc = useORPC()
  return useQuery(
    orpc.trialRedeemCode.list.queryOptions({
      input:
        displayStatuses && displayStatuses.length > 0
          ? { displayStatuses }
          : undefined,
    }),
  )
}
