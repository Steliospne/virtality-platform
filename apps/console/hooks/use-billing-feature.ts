'use client'

import { useEffect, useState } from 'react'
import { useFeatureFlagResult } from 'posthog-js/react'
import {
  BILLING_FEATURE_FLAG,
  resolveBillingFeatureEnabled,
} from '@/lib/billing-feature'

export { BILLING_FEATURE_FLAG }

/**
 * Whether billing UI (Profile → Billing tab, Remaining Time sidebar, renew
 * banner) is enabled for the identified user. Hidden by default until the
 * flag resolves enabled (release condition: email contains @virtality.app).
 */
export function useBillingFeatureEnabled(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const result = useFeatureFlagResult(BILLING_FEATURE_FLAG)
  return resolveBillingFeatureEnabled(mounted, result)
}
