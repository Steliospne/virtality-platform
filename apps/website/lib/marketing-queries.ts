'use client'

import { useQuery } from '@tanstack/react-query'
import { useORPC } from '@virtality/react-query'
import type { HighlightCardCollection } from '@virtality/shared/types'
import { withMarketingStaleTime } from './marketing-query-options'

export function usePartnerLogos() {
  const orpc = useORPC()
  return useQuery(withMarketingStaleTime(orpc.partnerLogo.list.queryOptions()))
}

export function useMosaic() {
  const orpc = useORPC()
  return useQuery(withMarketingStaleTime(orpc.mosaic.get.queryOptions()))
}

export function usePromoVideo() {
  const orpc = useORPC()
  return useQuery(withMarketingStaleTime(orpc.promoVideo.get.queryOptions()))
}

export function useHighlightCards(collection: HighlightCardCollection) {
  const orpc = useORPC()
  return useQuery(
    withMarketingStaleTime(
      orpc.highlightCard.list.queryOptions({ input: { collection } }),
    ),
  )
}
