import { describe, expect, it } from 'vitest'
import {
  campaignCouponSelectPlaceholder,
  formatCampaignAttachingStatus,
  formatCampaignCouponHealthLabel,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from './campaign-window.ts'

describe('campaign window display helpers', () => {
  it('describes attaching vs not attaching for Adminboard', () => {
    expect(formatCampaignAttachingStatus(true)).toMatch(/Attaching/)
    expect(formatCampaignAttachingStatus(false)).toMatch(/Not attaching/)
  })

  it('shows coupon health only when a window exists', () => {
    expect(formatCampaignCouponHealthLabel(false, 'healthy')).toBe('None')
    expect(formatCampaignCouponHealthLabel(true, 'archived')).toBe('Archived')
  })

  it('picks coupon select placeholder from loading and eligibility', () => {
    expect(campaignCouponSelectPlaceholder(true, 0)).toBe('Loading Coupons...')
    expect(campaignCouponSelectPlaceholder(false, 0)).toBe(
      'No eligible Coupons',
    )
    expect(campaignCouponSelectPlaceholder(false, 2)).toBe('Select a Coupon')
  })

  it('round-trips datetime-local values', () => {
    const iso = '2026-08-17T12:30:00.000Z'
    const local = toDatetimeLocalValue(iso)
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect(fromDatetimeLocalValue(local).getTime()).toBe(
      new Date(local).getTime(),
    )
  })
})
