import type { AdminEmailTopic } from '../../types/admin-email-targeting.ts'
import { normalizeEmailAddress } from './admin-email-audience.ts'
import {
  applyEmailOptOuts,
  type EmailOptOutRecord,
} from './admin-email-opt-out.ts'

export type ResolvedDraftRecipients = {
  /** Final list: explicit list ∪ Audience, minus Opt-outs, deduplicated. */
  recipients: string[]
  suppressed: string[]
  explicitCount: number
  audienceCount: number
  /** Addresses present in both the explicit list and the Audience. */
  overlapCount: number
  suppressedCount: number
  totalCount: number
}

/**
 * Combine a draft's Email Recipient List with its resolved Audience and
 * enforce Opt-outs for the draft's Topic. Pure; callers load the rows.
 */
export const resolveDraftRecipients = (input: {
  explicitRecipients: string[]
  audienceRecipients: string[]
  optOuts: EmailOptOutRecord[]
  topic: AdminEmailTopic
}): ResolvedDraftRecipients => {
  const seen = new Set<string>()
  const combined: string[] = []
  let overlapCount = 0

  for (const raw of input.explicitRecipients) {
    const email = normalizeEmailAddress(raw)
    if (email && !seen.has(email)) {
      seen.add(email)
      combined.push(email)
    }
  }

  for (const raw of input.audienceRecipients) {
    const email = normalizeEmailAddress(raw)
    if (!email) continue
    if (seen.has(email)) {
      overlapCount += 1
      continue
    }
    seen.add(email)
    combined.push(email)
  }

  const applied = applyEmailOptOuts(combined, input.optOuts, input.topic)

  return {
    recipients: applied.recipients,
    suppressed: applied.suppressed,
    explicitCount: input.explicitRecipients.length,
    audienceCount: input.audienceRecipients.length,
    overlapCount,
    suppressedCount: applied.suppressed.length,
    totalCount: applied.recipients.length,
  }
}
