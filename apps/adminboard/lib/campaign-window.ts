import type {
  CampaignCouponHealth,
  CampaignWindowLifecycle,
} from '@virtality/shared/utils'

export const CAMPAIGN_WINDOW_PAGE_DESCRIPTION =
  'At most one scheduled or live Campaign Window. While live and healthy, Subscribe Checkout auto-attaches the chosen Coupon for clinicians with no prior paid billing. Renew is excluded. Closing the window stops new attaches; existing Subscription Discounts continue per Coupon duration.'

export const CAMPAIGN_WINDOW_LIFECYCLE_LABELS: Record<
  CampaignWindowLifecycle,
  string
> = {
  none: 'No window',
  scheduled: 'Scheduled',
  live: 'Live',
  ended: 'Ended',
  closed: 'Closed',
}

export const CAMPAIGN_COUPON_HEALTH_LABELS: Record<
  CampaignCouponHealth,
  string
> = {
  healthy: 'Healthy',
  archived: 'Archived',
  deleted: 'Deleted in Stripe',
  applies_to_miss: 'Missing Pro applies_to',
}

export function formatCampaignAttachingStatus(attaching: boolean): string {
  return attaching
    ? 'Attaching on Subscribe Checkout'
    : 'Not attaching (window closed, not live, or Coupon unhealthy)'
}

export function formatCampaignCouponHealthLabel(
  hasWindow: boolean,
  couponHealth: CampaignCouponHealth,
): string {
  if (!hasWindow) return 'None'
  return CAMPAIGN_COUPON_HEALTH_LABELS[couponHealth]
}

export function campaignCouponSelectPlaceholder(
  pickerPending: boolean,
  couponCount: number,
): string {
  if (pickerPending) return 'Loading Coupons...'
  if (couponCount === 0) return 'No eligible Coupons'
  return 'Select a Coupon'
}

/** datetime-local value from an ISO timestamp (local timezone). */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDatetimeLocalValue(value: string): Date {
  return new Date(value)
}
