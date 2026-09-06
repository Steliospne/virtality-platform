import {
  isAccessGateOpenStatus,
  type AdminCustomerProfile,
  type RevokeAccessGateResult,
  type SetAccessGateTrialResult,
} from '@virtality/shared/utils'
import { formatExtensionClockEnd } from './entitlement-extension.ts'

export function isAccessGateStaffActionsBlocked(
  profile: AdminCustomerProfile,
): boolean {
  return profile.accessGrant?.status === 'converted'
}

function openAccessGate(profile: AdminCustomerProfile) {
  const grant = profile.accessGrant
  if (!grant || !isAccessGateOpenStatus(grant.status)) return null
  return grant
}

export function canAssignPermanentAccessGate(
  profile: AdminCustomerProfile,
): boolean {
  if (profile.role === 'admin') return false
  return !isAccessGateStaffActionsBlocked(profile)
}

export function canSetAccessGateTrial(profile: AdminCustomerProfile): boolean {
  if (profile.role === 'admin') return false
  return !isAccessGateStaffActionsBlocked(profile)
}

export function canRevokeAccessGate(profile: AdminCustomerProfile): boolean {
  if (profile.role === 'admin') return false
  if (isAccessGateStaffActionsBlocked(profile)) return false
  return openAccessGate(profile) != null
}

export function setAccessGateTrialActionLabel(
  profile: AdminCustomerProfile,
): string {
  return openAccessGate(profile)?.trialEnd != null
    ? 'Extend trial access'
    : 'Issue trial access'
}

export function formatAssignPermanentAccessGateSuccessMessage(input: {
  testerDemoted: boolean
}): string {
  return input.testerDemoted
    ? 'Assigned permanent Access Gate and changed the account role to user.'
    : 'Assigned permanent Access Gate. This does not unlock VR program launch.'
}

export function formatSetAccessGateTrialSuccessMessage(
  result: SetAccessGateTrialResult,
): string {
  const verb = result.mode === 'extended' ? 'Extended' : 'Issued'
  return `${verb} trial access through ${formatExtensionClockEnd(result.trialEnd)}.`
}

export function formatRevokeAccessGateSuccessMessage(
  result: RevokeAccessGateResult,
): string {
  return `Revoked Access Gate (${result.status}).`
}
