import type { PromotionCodeRecord } from '@virtality/shared/utils'

export function formatPromotionCodeStatus(
  promotionCode: PromotionCodeRecord,
): string {
  return promotionCode.active ? 'Active' : 'Inactive'
}

export function formatPromotionCodeExpiresAt(
  promotionCode: PromotionCodeRecord,
): string {
  if (promotionCode.expiresAt == null) return 'None'
  return new Date(promotionCode.expiresAt * 1000).toLocaleString()
}

export function formatPromotionCodeMaxRedemptions(
  promotionCode: PromotionCodeRecord,
): string {
  if (promotionCode.maxRedemptions == null) return 'Unlimited'
  return String(promotionCode.maxRedemptions)
}
