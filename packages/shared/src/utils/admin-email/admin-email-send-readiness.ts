import type { EmailBodyBlock } from '../../types/admin-email.ts'
import {
  hasMeaningfulEmailBodyContent,
  validateEmailBodyBlocks,
  validateEmailRecipientList,
} from './admin-email-blocks.ts'

export type EmailSendReadinessInput = {
  subject: string
  bodyBlocks: EmailBodyBlock[]
  recipients: string[]
  /** An attached Audience counts as a recipient source. */
  hasAudience?: boolean
}

export type EmailSendReadinessResult = {
  ready: boolean
  reasons: string[]
}

export const assessEmailSendReadiness = (
  input: EmailSendReadinessInput,
): EmailSendReadinessResult => {
  const reasons: string[] = []

  if (!input.subject.trim()) {
    reasons.push('subject is required')
  }

  const bodyError = validateEmailBodyBlocks(input.bodyBlocks)
  if (bodyError) {
    reasons.push(bodyError)
  } else if (!hasMeaningfulEmailBodyContent(input.bodyBlocks)) {
    reasons.push('valid body content is required')
  }

  const recipientError = validateEmailRecipientList(input.recipients)
  if (recipientError && !input.hasAudience) {
    reasons.push('recipient list or audience is required')
  } else if (recipientError && input.recipients.length > 0) {
    reasons.push(recipientError)
  }

  return {
    ready: reasons.length === 0,
    reasons,
  }
}
