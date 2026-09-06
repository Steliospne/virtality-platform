import {
  formatCustomerEntitlementSummary,
  formatCustomerSubscriptionDate,
} from './admin-customer-display.ts'
import {
  ACCESS_GRANT_STATUS_LABELS,
  type AdminCustomerAccessGrantSummary,
} from '@virtality/shared/utils'

export function formatAccessGrantStatusSummary(
  grant: AdminCustomerAccessGrantSummary,
): string {
  const statusLabel = ACCESS_GRANT_STATUS_LABELS[grant.status]

  if (grant.status === 'trialing') {
    const clock = formatCustomerEntitlementSummary({
      entitled: grant.entitled,
      remainingMs: grant.remainingMs,
      clockEnd: grant.trialEnd,
    })
    return `${statusLabel} · ${clock}`
  }

  const ended =
    grant.trialEnd != null
      ? ` · ended ${formatCustomerSubscriptionDate(grant.trialEnd)}`
      : ''
  return `${statusLabel}${ended}`
}
