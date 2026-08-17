import { describe, expect, it } from 'vitest'
import {
  highlightCardsCacheTag,
  isMarketingCacheTag,
  MARKETING_CACHE_TAGS,
} from './marketing-cache'

describe('marketing cache tags', () => {
  it('lists the allowlisted tags', () => {
    expect(MARKETING_CACHE_TAGS).toEqual([
      'partner-logos',
      'mosaic',
      'promo-video',
      'highlight-cards-benefits',
      'highlight-cards-features',
      'blog',
    ])
  })

  it('builds highlight-card tags per collection', () => {
    expect(highlightCardsCacheTag('benefits')).toBe('highlight-cards-benefits')
    expect(highlightCardsCacheTag('features')).toBe('highlight-cards-features')
  })

  it('type-guards allowlisted tags', () => {
    expect(isMarketingCacheTag('mosaic')).toBe(true)
    expect(isMarketingCacheTag('waitlist')).toBe(false)
  })
})
