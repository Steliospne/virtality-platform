import { describe, expect, it } from 'vitest'
import {
  formatPromotionCodeExpiresAt,
  formatPromotionCodeMaxRedemptions,
  formatPromotionCodeStatus,
} from './promotion-code-display'
import type { PromotionCodeRecord } from '@virtality/shared/utils'

function record(
  overrides: Partial<PromotionCodeRecord> = {},
): PromotionCodeRecord {
  return {
    id: 'promo_1',
    code: 'SAVE20',
    couponId: 'cou_1',
    active: true,
    expiresAt: null,
    maxRedemptions: null,
    timesRedeemed: 0,
    created: 1_700_000_000,
    ...overrides,
  }
}

describe('promotion-code-display', () => {
  it('labels active and inactive Promotion Codes', () => {
    expect(formatPromotionCodeStatus(record({ active: true }))).toBe('Active')
    expect(formatPromotionCodeStatus(record({ active: false }))).toBe(
      'Inactive',
    )
  })

  it('formats unlimited max redemptions and missing expiry', () => {
    expect(formatPromotionCodeMaxRedemptions(record())).toBe('Unlimited')
    expect(formatPromotionCodeExpiresAt(record())).toBe('None')
    expect(
      formatPromotionCodeMaxRedemptions(record({ maxRedemptions: 3 })),
    ).toBe('3')
  })
})
