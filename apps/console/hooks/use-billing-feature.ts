'use client'

import { resolveBillingFeatureEnabled } from '@/lib/billing-feature'

/**
 * Whether billing UI (Profile → Billing tab, Remaining Time sidebar, renew
 * banner) is enabled: on in preview and local dev, off on the live site.
 */
export function useBillingFeatureEnabled(): boolean {
  return resolveBillingFeatureEnabled()
}
