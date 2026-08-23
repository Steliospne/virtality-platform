import {
  formatAdminCustomerAccessActionLabel,
  isAdminCustomerAccessAction,
  type AdminCustomerBillingSnapshotState,
  type AdminCustomerProfile,
} from '@virtality/shared/utils'
import { formatCustomerPlanLabel } from './admin-customer-display.ts'

export function canAssignCustomerAccessGrant(
  profile: AdminCustomerProfile,
): boolean {
  if (profile.role === 'admin') return false
  return (
    profile.billingStatus !== 'active' && profile.billingStatus !== 'trialing'
  )
}

export function formatBillingSnapshotSummary(
  snapshot: AdminCustomerBillingSnapshotState | null,
): string {
  if (!snapshot) return 'Unknown'

  const parts: string[] = []
  if (snapshot.role) parts.push(`role ${snapshot.role}`)
  if (snapshot.stripeCustomerId) parts.push('Stripe customer present')
  if (snapshot.primaryPlan && snapshot.primaryStatus) {
    parts.push(
      `${formatCustomerPlanLabel(snapshot.primaryPlan)} ${snapshot.primaryStatus}`,
    )
  } else {
    parts.push('no primary subscription')
  }

  return parts.join('; ')
}

export function formatAuditActionLabel(action: string): string {
  if (isAdminCustomerAccessAction(action)) {
    return formatAdminCustomerAccessActionLabel(action)
  }
  return action
}

export const GRANT_TRIAL_DURATION_UNITS = ['days', 'weeks', 'months'] as const

export const GRANT_TRIAL_DURATION_UNIT_LABELS: Record<
  (typeof GRANT_TRIAL_DURATION_UNITS)[number],
  string
> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
}

export function formatAssignPermanentFreeSuccessMessage(input: {
  testerDemoted: boolean
}): string {
  return input.testerDemoted
    ? 'Assigned permanent Free and changed the account role to user.'
    : 'Assigned permanent Free. Subscription state settles after Stripe webhook sync.'
}

export function formatGrantTimedTrialSuccessMessage(input: {
  trialEnd: Date | string
  testerDemoted: boolean
}): string {
  const end = new Date(input.trialEnd).toLocaleString()
  const base = `Granted a timed trial through ${end}. VR launch restores after Stripe webhook sync.`
  return input.testerDemoted ? `${base} Account role changed to user.` : base
}
