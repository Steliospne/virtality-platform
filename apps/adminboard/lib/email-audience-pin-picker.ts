import { parseRecipientsFromInput } from './admin-email-recipients'

export type EmailAudiencePinCandidate = {
  email: string
  /** Display name for registered users; null for Waitlist emails. */
  name: string | null
  source: 'user' | 'waitlist'
}

export const MAX_EMAIL_AUDIENCE_PIN_RESULTS = 50

/** Case-insensitive match on name or email; already-pinned rows are hidden. */
export const filterEmailAudiencePinCandidates = (
  candidates: EmailAudiencePinCandidate[],
  query: string,
  pinnedText: string,
): EmailAudiencePinCandidate[] => {
  const pinned = new Set(
    parseRecipientsFromInput(pinnedText).map((email) => email.toLowerCase()),
  )
  const needle = query.trim().toLowerCase()

  return candidates
    .filter((candidate) => !pinned.has(candidate.email.toLowerCase()))
    .filter(
      (candidate) =>
        !needle ||
        candidate.email.toLowerCase().includes(needle) ||
        (candidate.name?.toLowerCase().includes(needle) ?? false),
    )
    .slice(0, MAX_EMAIL_AUDIENCE_PIN_RESULTS)
}

/** Append one email to a one-per-line pin textarea, ignoring duplicates. */
export const appendEmailAudiencePin = (
  pinnedText: string,
  email: string,
): string => {
  const existing = parseRecipientsFromInput(pinnedText)
  if (existing.some((pin) => pin.toLowerCase() === email.toLowerCase())) {
    return pinnedText
  }

  return [...existing, email].join('\n')
}
