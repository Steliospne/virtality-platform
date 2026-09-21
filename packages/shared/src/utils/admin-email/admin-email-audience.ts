import {
  EMPTY_EMAIL_AUDIENCE_RULE,
  MAX_EMAIL_AUDIENCE_PINS,
  emailAudienceRuleSchema,
  type EmailAudienceRule,
} from '../../types/admin-email-targeting.ts'

export const normalizeEmailAddress = (email: string): string =>
  email.trim().toLowerCase()

export const parseEmailAudienceRuleJson = (
  value: string,
): EmailAudienceRule => {
  try {
    const parsed = emailAudienceRuleSchema.safeParse(JSON.parse(value))
    return parsed.success ? parsed.data : EMPTY_EMAIL_AUDIENCE_RULE
  } catch {
    return EMPTY_EMAIL_AUDIENCE_RULE
  }
}

export const serializeEmailAudienceRuleJson = (
  rule: EmailAudienceRule,
): string => JSON.stringify(rule)

const emailAddressPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateEmailAudiencePins = (
  pins: string[],
  label: 'include' | 'exclude',
): string | null => {
  if (pins.length > MAX_EMAIL_AUDIENCE_PINS) {
    return `${label} pins cannot exceed ${MAX_EMAIL_AUDIENCE_PINS} emails`
  }

  if (pins.some((pin) => !emailAddressPattern.test(pin.trim()))) {
    return `${label} pins contain an invalid email`
  }

  return null
}

export const validateEmailAudienceName = (name: string): string | null =>
  name.trim() ? null : 'audience name is required'

/** Whether the Audience can ever produce recipients. */
export const emailAudienceHasSource = (
  rule: EmailAudienceRule,
  includeEmails: string[],
): boolean =>
  rule.includeUsers || rule.includeWaitlist || includeEmails.length > 0

export type EmailAudienceCandidate = {
  email: string
  /** Null for Waitlist emails. */
  role: string | null
}

export type EmailAudienceSources = {
  users: EmailAudienceCandidate[]
  waitlist: string[]
}

export type ResolvedEmailAudience = {
  recipients: string[]
  fromUsers: number
  fromWaitlist: number
  fromIncludePins: number
  excludedByPins: number
}

const userMatchesRule = (
  candidate: EmailAudienceCandidate,
  rule: EmailAudienceRule,
): boolean =>
  rule.userRoles.length === 0 ||
  rule.userRoles.includes(
    (candidate.role ?? 'user') as EmailAudienceRule['userRoles'][number],
  )

/**
 * Resolve an Audience to a deduplicated, lower-cased recipient list:
 * dynamic rule over the given sources, plus include pins, minus exclude pins.
 * Pure: callers load the source rows.
 */
export const resolveEmailAudience = (
  input: {
    rule: EmailAudienceRule
    includeEmails: string[]
    excludeEmails: string[]
  },
  sources: EmailAudienceSources,
): ResolvedEmailAudience => {
  const excluded = new Set(input.excludeEmails.map(normalizeEmailAddress))
  const seen = new Set<string>()
  const recipients: string[] = []
  let fromUsers = 0
  let fromWaitlist = 0
  let fromIncludePins = 0
  let excludedByPins = 0

  const add = (raw: string, bucket: 'users' | 'waitlist' | 'pins') => {
    const email = normalizeEmailAddress(raw)
    if (!email || seen.has(email)) {
      return
    }

    seen.add(email)

    if (excluded.has(email)) {
      excludedByPins += 1
      return
    }

    recipients.push(email)
    if (bucket === 'users') fromUsers += 1
    if (bucket === 'waitlist') fromWaitlist += 1
    if (bucket === 'pins') fromIncludePins += 1
  }

  if (input.rule.includeUsers) {
    for (const user of sources.users) {
      if (userMatchesRule(user, input.rule)) {
        add(user.email, 'users')
      }
    }
  }

  if (input.rule.includeWaitlist) {
    for (const email of sources.waitlist) {
      add(email, 'waitlist')
    }
  }

  for (const email of input.includeEmails) {
    add(email, 'pins')
  }

  return {
    recipients,
    fromUsers,
    fromWaitlist,
    fromIncludePins,
    excludedByPins,
  }
}
