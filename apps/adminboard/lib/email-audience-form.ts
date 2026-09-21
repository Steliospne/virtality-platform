import {
  EMPTY_EMAIL_AUDIENCE_RULE,
  type EmailAudienceRule,
  type EmailAudienceUserRole,
} from '@virtality/shared/types'
import { parseRecipientsFromInput } from './admin-email-recipients'

export type EmailAudienceFormState = {
  name: string
  description: string
  rule: EmailAudienceRule
  includeText: string
  excludeText: string
}

export type EmailAudienceFormSource = {
  name: string
  description: string | null
  rule: EmailAudienceRule
  includeEmails: string[]
  excludeEmails: string[]
}

export const EMPTY_EMAIL_AUDIENCE_FORM: EmailAudienceFormState = {
  name: '',
  description: '',
  rule: EMPTY_EMAIL_AUDIENCE_RULE,
  includeText: '',
  excludeText: '',
}

export const toEmailAudienceForm = (
  audience: EmailAudienceFormSource,
): EmailAudienceFormState => ({
  name: audience.name,
  description: audience.description ?? '',
  rule: audience.rule,
  includeText: audience.includeEmails.join('\n'),
  excludeText: audience.excludeEmails.join('\n'),
})

/** The payload shape shared by create, update and preview. */
export const toEmailAudienceInput = (form: EmailAudienceFormState) => ({
  name: form.name,
  description: form.description.trim() ? form.description : null,
  rule: form.rule,
  includeEmails: parseRecipientsFromInput(form.includeText),
  excludeEmails: parseRecipientsFromInput(form.excludeText),
})

export const isEmailAudienceFormDirty = (
  form: EmailAudienceFormState,
  saved: EmailAudienceFormState,
): boolean => JSON.stringify(form) !== JSON.stringify(saved)

export const toggleEmailAudienceRole = (
  roles: EmailAudienceUserRole[],
  role: EmailAudienceUserRole,
): EmailAudienceUserRole[] =>
  roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]

export const EMAIL_AUDIENCE_ROLE_LABELS: Record<EmailAudienceUserRole, string> =
  {
    user: 'Clinicians',
    admin: 'Admins',
    tester: 'Testers',
  }

/** One line summary of what an Audience rule reaches. */
export const describeEmailAudienceRule = (
  rule: EmailAudienceRule,
  includeCount: number,
): string => {
  const parts: string[] = []

  if (rule.includeUsers) {
    parts.push(
      rule.userRoles.length === 0
        ? 'all registered users'
        : rule.userRoles
            .map((role) => EMAIL_AUDIENCE_ROLE_LABELS[role])
            .join(' + '),
    )
  }

  if (rule.includeWaitlist) {
    parts.push('waitlist')
  }

  if (includeCount > 0) {
    parts.push(`${includeCount} pinned`)
  }

  return parts.length > 0 ? parts.join(', ') : 'No sources yet'
}
