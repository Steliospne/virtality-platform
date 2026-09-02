import {
  formatCustomerEntitlementSummary,
  formatCustomerSubscriptionDate,
} from './admin-customer-display.ts'
import {
  TRIAL_GRANT_STATUS_LABELS,
  type AdminCustomerTrialGrantSummary,
} from '@virtality/shared/utils'

export function formatTrialGrantStatusSummary(
  grant: AdminCustomerTrialGrantSummary,
): string {
  const statusLabel = TRIAL_GRANT_STATUS_LABELS[grant.status]

  if (grant.status === 'active') {
    const clock = formatCustomerEntitlementSummary({
      entitled: grant.entitled,
      remainingMs: grant.remainingMs,
      clockEnd: grant.trialEnd,
    })
    return `${statusLabel} · ${clock} · code ${grant.code}`
  }

  if (grant.status === 'pending') {
    return `${statusLabel} · code ${grant.code}`
  }

  const ended =
    grant.trialEnd != null
      ? ` · ended ${formatCustomerSubscriptionDate(grant.trialEnd)}`
      : ''
  return `${statusLabel}${ended} · code ${grant.code}`
}
