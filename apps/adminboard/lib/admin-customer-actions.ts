import {
  findLivePaidProSubscription,
  formatAdminCustomerAccessActionLabel,
  formatAdminCustomerBillingActionLabel,
  formatAdminCustomerTrialGrantActionLabel,
  isAdminCustomerAccessAction,
  isAdminCustomerBillingAction,
  isAdminCustomerTrialGrantAction,
  qualifiesForAssignFreeAfterCancellation,
  type AdminCustomerBillingSnapshotState,
  type AdminCustomerProfile,
} from '@virtality/shared/utils'
import { formatCustomerPlanLabel } from './admin-customer-display.ts'

export function canAssignCustomerAccessGrant(
  profile: AdminCustomerProfile,
): boolean {
  if (profile.role === 'admin') return false
  // A Free-plan subscription (e.g. from an access-code redemption) must not
  // block granting a real Pro trial — only a live Pro subscription should.
  return findLivePaidProSubscription(profile.subscriptionHistory) == null
}

export function formatBillingSnapshotSummary(
  snapshot: AdminCustomerBillingSnapshotState | null,
): string {
  if (!snapshot) return 'Unknown'

  const parts: string[] = []
  if (snapshot.role) parts.push(`role ${snapshot.role}`)
  if (snapshot.stripeCustomerId) parts.push('Stripe customer present')
  if (snapshot.assignedProVariant) {
    parts.push(`variant ${snapshot.assignedProVariant}`)
  }
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
  if (action === 'assign_pro_variant') return 'Assign Pro variant'
  if (isAdminCustomerAccessAction(action)) {
    return formatAdminCustomerAccessActionLabel(action)
  }
  if (isAdminCustomerTrialGrantAction(action)) {
    return formatAdminCustomerTrialGrantActionLabel(action)
  }
  if (isAdminCustomerBillingAction(action)) {
    return formatAdminCustomerBillingActionLabel(action)
  }
  return action
}

export function canAdministerPaidBilling(
  profile: AdminCustomerProfile,
): boolean {
  if (profile.role === 'admin') return false
  return (
    profile.billingStatus === 'active' || profile.billingStatus === 'past_due'
  )
}

export function canCancelPaidBilling(profile: AdminCustomerProfile): boolean {
  return canAdministerPaidBilling(profile)
}

export function canChangePaidPlan(profile: AdminCustomerProfile): boolean {
  if (profile.role === 'admin') return false
  return (
    profile.billingStatus === 'active' ||
    profile.billingStatus === 'past_due' ||
    profile.billingStatus === 'absent' ||
    profile.billingStatus === 'canceled' ||
    profile.accessStatus === 'free' ||
    profile.accessStatus === 'blocked'
  )
}

export function canReactivatePaidBilling(
  profile: AdminCustomerProfile,
): boolean {
  if (!canAdministerPaidBilling(profile)) return false
  const livePaidPro = findLivePaidProSubscription(profile.subscriptionHistory)
  return livePaidPro?.cancelAtPeriodEnd === true
}

export function canCancelCyclePlanChange(
  profile: AdminCustomerProfile,
): boolean {
  if (profile.role === 'admin') return false
  return profile.hasPendingCyclePlanChange === true
}

export function getCancelPaidSubscriptionPreviewPeriodEnd(
  profile: AdminCustomerProfile,
): Date | null {
  return (
    findLivePaidProSubscription(profile.subscriptionHistory)?.periodEnd ?? null
  )
}

export function getReactivatePaidSubscriptionPreviewPeriodEnd(
  profile: AdminCustomerProfile,
): Date | null {
  const livePaidPro = findLivePaidProSubscription(profile.subscriptionHistory)
  if (!livePaidPro?.cancelAtPeriodEnd) return null
  return livePaidPro.periodEnd ?? null
}

export function getCancelCyclePlanChangePreviewPeriodEnd(
  profile: AdminCustomerProfile,
): Date | null {
  if (!profile.hasPendingCyclePlanChange) return null
  return (
    findLivePaidProSubscription(profile.subscriptionHistory)?.periodEnd ?? null
  )
}

export function canAssignFreeAfterCancellation(
  profile: AdminCustomerProfile,
): boolean {
  if (profile.role === 'admin') return false
  return qualifiesForAssignFreeAfterCancellation(profile.subscriptionHistory)
}

export function formatBillingMutationSuccessMessage(input: {
  pendingWebhookSync: boolean
  checkoutUrl?: string
}): string {
  if (input.checkoutUrl) {
    return `Checkout link created. Share it with the customer. Billing state settles after Stripe webhook sync.`
  }
  if (input.pendingWebhookSync) {
    return 'Billing mutation accepted. Subscription state settles after Stripe webhook sync.'
  }
  return 'Billing mutation completed.'
}

export const TESTER_RECIPIENT_DIALOG_NOTE =
  ' This tester account will become a standard user.'

export function formatMutationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error ? error.message : fallback
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
