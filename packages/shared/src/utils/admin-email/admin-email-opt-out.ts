import type {
  AdminEmailTopic,
  EmailOptOutScope,
} from '../../types/admin-email-targeting.ts'
import { normalizeEmailAddress } from './admin-email-audience.ts'

export type EmailOptOutRecord = {
  email: string
  /** Null means all Topics. */
  topic: AdminEmailTopic | null
}

export const emailOptOutScopeToTopic = (
  scope: EmailOptOutScope,
): AdminEmailTopic | null => (scope === 'all' ? null : scope)

export const emailOptOutTopicToScope = (
  topic: AdminEmailTopic | null,
): EmailOptOutScope => topic ?? 'all'

/** Whether an existing Opt-out already covers the requested scope. */
export const isEmailOptOutCovered = (
  existing: EmailOptOutRecord[],
  candidate: EmailOptOutRecord,
): boolean => {
  const email = normalizeEmailAddress(candidate.email)
  return existing.some(
    (record) =>
      normalizeEmailAddress(record.email) === email &&
      (record.topic === null || record.topic === candidate.topic),
  )
}

export const isRecipientOptedOut = (
  optOuts: EmailOptOutRecord[],
  recipient: string,
  topic: AdminEmailTopic,
): boolean => isEmailOptOutCovered(optOuts, { email: recipient, topic })

export type AppliedEmailOptOuts = {
  recipients: string[]
  suppressed: string[]
}

/**
 * Enforce Opt-outs for one Topic on a resolved recipient list, however the
 * recipients reached the draft (explicit list or Audience).
 */
export const applyEmailOptOuts = (
  recipients: string[],
  optOuts: EmailOptOutRecord[],
  topic: AdminEmailTopic,
): AppliedEmailOptOuts => {
  const allTopics = new Set<string>()
  const thisTopic = new Set<string>()

  for (const record of optOuts) {
    const email = normalizeEmailAddress(record.email)
    if (record.topic === null) {
      allTopics.add(email)
    } else if (record.topic === topic) {
      thisTopic.add(email)
    }
  }

  const kept: string[] = []
  const suppressed: string[] = []

  for (const recipient of recipients) {
    const email = normalizeEmailAddress(recipient)
    if (allTopics.has(email) || thisTopic.has(email)) {
      suppressed.push(recipient)
    } else {
      kept.push(recipient)
    }
  }

  return { recipients: kept, suppressed }
}
