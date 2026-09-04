/**
 * Billing UI (Profile → Billing tab, Remaining Time sidebar, renew banner)
 * is a preview/local-only feature: on for every non-production deploy, off
 * on the live site. `NEXT_PUBLIC_ENV` is inlined at build time, so this
 * agrees between server and client with no flag round-trip and no
 * hydration mismatch.
 */
export function resolveBillingFeatureEnabled(
  env: string | undefined = process.env.NEXT_PUBLIC_ENV,
): boolean {
  return env !== 'production'
}
