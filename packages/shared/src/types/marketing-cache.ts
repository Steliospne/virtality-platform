import type { HighlightCardCollection } from './highlight-card.js'

export const MARKETING_CACHE_TAGS = [
  'partner-logos',
  'mosaic',
  'promo-video',
  'highlight-cards-benefits',
  'highlight-cards-features',
] as const

export type MarketingCacheTag = (typeof MARKETING_CACHE_TAGS)[number]

export function highlightCardsCacheTag(
  collection: HighlightCardCollection,
): MarketingCacheTag {
  return `highlight-cards-${collection}`
}

export function isMarketingCacheTag(tag: string): tag is MarketingCacheTag {
  return (MARKETING_CACHE_TAGS as readonly string[]).includes(tag)
}
