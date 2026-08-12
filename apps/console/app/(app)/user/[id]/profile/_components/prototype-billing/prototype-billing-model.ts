/**
 * PROTOTYPE ONLY: throwaway Profile Billing UI exploration.
 *
 * Question: What should Profile → Billing look like for tester→paid conversion
 * with Monthly vs Yearly Pro Checkout?
 *
 * Three variants on the existing profile route via ?variant=A|B|C.
 * Shared functional model: interval → annual upgrade params via
 * buildProCheckoutUpgradeInput; Checkout is stubbed (no Stripe redirect).
 */

export type PrototypeBillingInterval = 'month' | 'year'

export type PrototypeBillingScenarioId =
  | 'tester_never_entitled'
  | 'expired_trial'
  | 'active_monthly'
  | 'active_yearly'
  | 'canceled_paid'

export type PrototypeBillingStanding = {
  role: 'tester' | 'clinician'
  subscriptionStatus:
    | 'never_entitled'
    | 'trialing'
    | 'active'
    | 'canceled'
    | 'expired'
  billingPathEstablished: boolean
  interval: PrototypeBillingInterval | null
  clockEndLabel: string | null
  hadPaidBilling: boolean
}

export type PrototypeBillingPlanPrices = {
  /** Primary monthly plan price, e.g. "€89 / month". */
  monthlyLabel: string
  /** Yearly plan shown as monthly equivalent, e.g. "€74 / month". */
  yearlyAsMonthlyLabel: string
  /** Muted yearly total under the monthly-equivalent, e.g. "€890 / year". */
  yearlyTotalMutedLabel: string
  yearlySavingsLabel: string
}

export const PROTOTYPE_BILLING_PRICES: PrototypeBillingPlanPrices = {
  monthlyLabel: '€89 / month',
  yearlyAsMonthlyLabel: '€74 / month',
  yearlyTotalMutedLabel: '€890 / year',
  yearlySavingsLabel: 'Save ~2 months',
}

export const PROTOTYPE_BILLING_SCENARIOS: Record<
  PrototypeBillingScenarioId,
  { label: string; standing: PrototypeBillingStanding }
> = {
  tester_never_entitled: {
    label: 'Tester, no Subscription',
    standing: {
      role: 'tester',
      subscriptionStatus: 'never_entitled',
      billingPathEstablished: false,
      interval: null,
      clockEndLabel: null,
      hadPaidBilling: false,
    },
  },
  expired_trial: {
    label: 'Expired trial',
    standing: {
      role: 'clinician',
      subscriptionStatus: 'expired',
      billingPathEstablished: true,
      interval: 'month',
      clockEndLabel: 'Ended 3 days ago',
      hadPaidBilling: false,
    },
  },
  active_monthly: {
    label: 'Active monthly',
    standing: {
      role: 'clinician',
      subscriptionStatus: 'active',
      billingPathEstablished: true,
      interval: 'month',
      clockEndLabel: 'Renews 12 Sep 2026',
      hadPaidBilling: true,
    },
  },
  active_yearly: {
    label: 'Active yearly',
    standing: {
      role: 'clinician',
      subscriptionStatus: 'active',
      billingPathEstablished: true,
      interval: 'year',
      clockEndLabel: 'Renews 12 Aug 2027',
      hadPaidBilling: true,
    },
  },
  canceled_paid: {
    label: 'Canceled after paid',
    standing: {
      role: 'clinician',
      subscriptionStatus: 'canceled',
      billingPathEstablished: true,
      interval: 'month',
      clockEndLabel: 'Ended 1 week ago',
      hadPaidBilling: true,
    },
  },
}

export type PrototypeBillingVariantProps = {
  standing: PrototypeBillingStanding
  prices: PrototypeBillingPlanPrices
  selectedInterval: PrototypeBillingInterval
  onSelectInterval: (interval: PrototypeBillingInterval) => void
  onCheckout: () => void
  lastAction: string | null
}

export function prototypeCheckoutCtaLabel(
  standing: PrototypeBillingStanding,
): string {
  if (standing.subscriptionStatus === 'active') return 'Manage in portal'
  if (standing.hadPaidBilling) return 'Renew'
  if (!standing.billingPathEstablished) return 'Become a paying customer'
  return 'Subscribe'
}

export function prototypeStatusHeadline(
  standing: PrototypeBillingStanding,
): string {
  switch (standing.subscriptionStatus) {
    case 'never_entitled':
      return 'No plan yet'
    case 'trialing':
      return 'Trial in progress'
    case 'active':
      return standing.interval === 'year' ? 'Pro · Yearly': 'Pro · Monthly'
    case 'canceled':
      return 'Subscription canceled'
    case 'expired':
      return 'Entitlement ended'
  }
}

export function formatPrototypeBillingState(input: {
  scenarioId: PrototypeBillingScenarioId
  variant: string
  selectedInterval: PrototypeBillingInterval
  lastAction: string | null
  standing: PrototypeBillingStanding
}): string {
  return JSON.stringify(
    {
      scenarioId: input.scenarioId,
      variant: input.variant,
      selectedInterval: input.selectedInterval,
      lastAction: input.lastAction,
      standing: input.standing,
    },
    null,
    2,
  )
}
