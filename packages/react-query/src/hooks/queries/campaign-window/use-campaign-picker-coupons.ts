import { useQuery } from '@tanstack/react-query'
import { useORPC } from '../../../orpc-context.js'

export function useCampaignPickerCoupons() {
  const orpc = useORPC()
  return useQuery(orpc.campaignWindow.listPickerCoupons.queryOptions())
}
