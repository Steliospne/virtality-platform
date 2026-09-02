import {
  findLivePaidProSubscription,
  isTrialGrantOpenStatus,
  type AdminCustomerProfile,
  type AdminCustomerTrialGrantSummary,
  type AdjustTrialGrantResult,
  type IssueTrialGrantResult,
  type RevokeTrialGrantResult,
  type StartTrialGrantResult,
} from '@virtality/shared/utils'
import { formatExtensionClockEnd } from './entitlement-extension.ts'

function openTrialGrant(
  profile: AdminCustomerProfile,
): AdminCustomerTrialGrantSummary | null {
  const grant = profile.trialGrant
  if (!grant || !isTrialGrantOpenStatus(grant.status)) return null
  return grant
}

export function canIssueTrialGrant(profile: AdminCustomerProfile): boolean {
  if (profile.role === 'admin') return false
  if (openTrialGrant(profile)) return false
  return findLivePaidProSubscription(profile.subscriptionHistory) == null
}

export function canStartTrialGrant(profile: AdminCustomerProfile): boolean {
  return openTrialGrant(profile)?.status === 'pending'
}

export function canAdjustTrialGrant(profile: AdminCustomerProfile): boolean {
  return openTrialGrant(profile)?.status === 'active'
}

export function canRevokeTrialGrant(profile: AdminCustomerProfile): boolean {
  return openTrialGrant(profile) != null
}

export function formatIssueTrialGrantSuccessMessage(
  result: IssueTrialGrantResult,
): string {
  return `Issued trial grant ${result.code} (${result.status}).`
}

export function formatStartTrialGrantSuccessMessage(
  result: StartTrialGrantResult,
): string {
  return `Started trial grant through ${formatExtensionClockEnd(result.trialEnd)}.`
}

export function formatAdjustTrialGrantSuccessMessage(
  result: AdjustTrialGrantResult,
): string {
  return `Adjusted trial grant through ${formatExtensionClockEnd(result.trialEnd)}.`
}

export function formatRevokeTrialGrantSuccessMessage(
  result: RevokeTrialGrantResult,
): string {
  return `Revoked trial grant (${result.status}).`
}
