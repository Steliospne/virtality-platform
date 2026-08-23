import {
  CUSTOMER_ACCESS_STATUS_LABELS,
  CUSTOMER_BILLING_STATUS_LABELS,
  formatEntitlementClockEndLabel,
  formatRemainingTimeLabel,
  isFreeSubscriptionPlan,
  isProSubscriptionPlan,
  type CustomerAccessStatus,
  type CustomerBillingStatus,
} from '@virtality/shared/utils'

export function formatCustomerAccessStatus(
  status: CustomerAccessStatus,
): string {
  return CUSTOMER_ACCESS_STATUS_LABELS[status]
}

export function formatCustomerBillingStatus(
  status: CustomerBillingStatus,
): string {
  return CUSTOMER_BILLING_STATUS_LABELS[status]
}

export function formatCustomerEntitlementSummary(input: {
  entitled: boolean
  remainingMs: number
  clockEnd: Date | string | null
}): string {
  if (!input.entitled) {
    return 'Expired'
  }

  const remaining = formatRemainingTimeLabel(input.remainingMs)
  if (input.clockEnd == null) {
    return remaining
  }

  const endLabel = formatEntitlementClockEndLabel(new Date(input.clockEnd))
  return `${remaining} remaining (ends ${endLabel})`
}

export function formatCustomerSubscriptionDate(
  value: Date | string | null | undefined,
): string {
  if (value == null) return '-'
  return formatEntitlementClockEndLabel(new Date(value))
}

export function formatCustomerPlanLabel(plan: string): string {
  if (isFreeSubscriptionPlan(plan)) return 'Free'
  if (isProSubscriptionPlan(plan)) return 'Pro'
  return plan
}
