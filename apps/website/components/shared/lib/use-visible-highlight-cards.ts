'use client'

import { useHighlightCards } from '@/lib/marketing-queries'
import type { HighlightCardCollection } from '@virtality/shared/types'
import { shouldShowHighlightCards } from './highlight-card-visibility'

export function useVisibleHighlightCards(collection: HighlightCardCollection) {
  const { data, isPending } = useHighlightCards(collection)

  return {
    cards: shouldShowHighlightCards(data) ? data : undefined,
    isPending,
  }
}
