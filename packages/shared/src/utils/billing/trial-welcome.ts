import type { AccessGateClock } from './access-gate.ts'

export const TRIAL_WELCOME_PATH = '/welcome/trial' as const

function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'tester'
}

/**
 * Timed Access Gate trial welcome: show `/welcome/trial` once per open
 * `trialing` grant. Permanent grants, expired clocks, staff, and already-seen
 * rows stay off this page. Extending a trial does not reset the flag.
 */
export function shouldShowTrialWelcome(input: {
  role?: string | null
  accessGate: AccessGateClock | null | undefined
  /** When omitted, treat as already seen so callers that skip the column do not redirect. */
  hasSeenWelcome?: boolean
  now?: Date
}): boolean {
  if (isStaffRole(input.role)) return false
  if (input.hasSeenWelcome !== false) return false

  const gate = input.accessGate
  if (!gate || gate.status !== 'trialing' || gate.trialEnd == null) {
    return false
  }

  const now = input.now ?? new Date()
  return gate.trialEnd.getTime() > now.getTime()
}
