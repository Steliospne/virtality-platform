/** PostHog flag: Profile Billing + Remaining Time clock (virtality.app only). */
export const BILLING_FEATURE_FLAG = 'billing_feature'

type FeatureFlagResultLike =
  | {
      enabled?: boolean
    }
  | null
  | undefined

/**
 * SSR and the first client paint must agree. PostHog can already have
 * `billing_feature` on the client (bootstrapped / persisted) while SSR has no
 * flag, which would otherwise insert Remaining Time after hydration.
 */
export function resolveBillingFeatureEnabled(
  mounted: boolean,
  result: FeatureFlagResultLike,
): boolean {
  return mounted && result?.enabled === true
}
