'use client'

import { usePostHogIdentifyOnSession } from '@/hooks/use-posthog-identify-on-session'
import { useInvalidateBillingOnVerification } from '@/hooks/use-invalidate-billing-on-verification'
import { useInvalidateEntitlementsOnLogin } from '@/hooks/use-invalidate-entitlements-on-login'

/**
 * Mount once under the app root so PostHog flags and billing/entitlement
 * standing refresh whenever the auth session changes (sign-in, sign-in as a
 * different user, or email verification completing in another tab/context).
 */
const SessionSync = () => {
  usePostHogIdentifyOnSession()
  useInvalidateBillingOnVerification()
  useInvalidateEntitlementsOnLogin()
  return null
}

export default SessionSync
