'use client'

import { useFeatureFlagResult } from 'posthog-js/react'

/** PostHog flag: Profile Billing + Remaining Time clock (virtality.app only). */
export const BILLING_FEATURE_FLAG = 'billing_feature'

/**
 * Whether billing UI (Profile → Billing tab, Remaining Time sidebar, renew
 * banner) is enabled for the identified user. Hidden by default until the
 * flag resolves enabled (release condition: email contains @virtality.app).
 */
export function useBillingFeatureEnabled(): boolean {
  const result = useFeatureFlagResult(BILLING_FEATURE_FLAG)
  return result?.enabled === true
}
