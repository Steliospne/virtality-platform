import {
  CUSTOMER_ACCESS_STATUS_LABELS,
  CUSTOMER_BILLING_STATUS_LABELS,
  DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
  formatEntitlementClockEndLabel,
  formatRemainingTimeLabel,
  isFreeSubscriptionPlan,
  isDefaultSubscriptionPlan,
  type CustomerAccessStatus,
  type CustomerBillingStatus,
} from '@virtality/shared/utils'

export function formatCustomerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

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

export function formatCustomerPlanLabel(
  plan: string,
  productName: string = DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
): string {
  if (isFreeSubscriptionPlan(plan)) return 'Free'
  if (isDefaultSubscriptionPlan(plan)) return productName
  return plan
}
