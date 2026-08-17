import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCampaignWindow() {
  const orpc = useORPC()
  return useQuery(orpc.campaignWindow.get.queryOptions())
}
