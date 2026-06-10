import type { EmailBodyBlock } from '../types/admin-email.ts'
import {
  hasMeaningfulEmailBodyContent,
  validateEmailBodyBlocks,
  validateEmailRecipientList,
} from './admin-email-blocks.ts'

export type EmailSendReadinessInput = {
  subject: string
  bodyBlocks: EmailBodyBlock[]
  recipients: string[]
  hasSuccessfulTestSend: boolean
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
  if (recipientError) {
    reasons.push('recipient list is required')
  }

  if (!input.hasSuccessfulTestSend) {
    reasons.push('successful test send is required')
  }

  return {
    ready: reasons.length === 0,
    reasons,
  }
}
