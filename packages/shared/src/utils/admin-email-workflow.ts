import type { EmailBodyBlock } from '../types/admin-email.ts'
import {
  parseEmailBodyBlocksJson,
  serializeEmailBodyBlocksJson,
} from './admin-email-persistence.ts'
import {
  hasMeaningfulEmailBodyContent,
  validateEmailBodyBlocks,
  validateEmailRecipientList,
} from './admin-email-blocks.ts'
import { assessEmailSendReadiness } from './admin-email-send-readiness.ts'

export type DraftRecord = {
  subject: string
  previewText: string | null
  bodyBlocksJson: string
  recipients: string[]
  hasSuccessfulTestSend: boolean
  sentRecordCount?: number
}

export type DraftUpdateInput = {
  subject?: string
  previewText?: string | null
  bodyBlocks?: EmailBodyBlock[]
  recipients?: string[]
}

export type FinalSendConfirmation = {
  confirmedSubject: string
  confirmedRecipientCount: number
}

export const draftHasFinalSend = (draft: DraftRecord): boolean =>
  (draft.sentRecordCount ?? 0) > 0

export const parseDraftBodyBlocks = (draft: DraftRecord): EmailBodyBlock[] =>
  parseEmailBodyBlocksJson(draft.bodyBlocksJson)

export const getDraftSendReadiness = (draft: DraftRecord) =>
  assessEmailSendReadiness({
    subject: draft.subject,
    bodyBlocks: parseDraftBodyBlocks(draft),
    recipients: draft.recipients,
    hasSuccessfulTestSend: draft.hasSuccessfulTestSend,
  })

export const validateDraftRecipientsInput = (
  recipients: string[] | undefined,
): string | null => {
  if (recipients === undefined) {
    return null
  }

  if (recipients.length === 0) {
    return null
  }

  return validateEmailRecipientList(recipients)
}

export const validateDraftBodyBlocksInput = (
  bodyBlocks: EmailBodyBlock[] | undefined,
): string | null => {
  if (bodyBlocks === undefined) {
    return null
  }

  return validateEmailBodyBlocks(bodyBlocks)
}

const bodyBlocksEqual = (
  left: EmailBodyBlock[],
  right: EmailBodyBlock[],
): boolean => serializeEmailBodyBlocksJson(left) === serializeEmailBodyBlocksJson(right)

const recipientsEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false
  }

  return left.every((recipient, index) => recipient === right[index])
}

export const shouldInvalidateTestSend = (
  draft: DraftRecord,
  update: DraftUpdateInput,
): boolean => {
  if (update.subject !== undefined && update.subject !== draft.subject) {
    return true
  }

  if (
    update.previewText !== undefined &&
    update.previewText !== draft.previewText
  ) {
    return true
  }

  if (
    update.recipients !== undefined &&
    !recipientsEqual(update.recipients, draft.recipients)
  ) {
    return true
  }

  if (update.bodyBlocks !== undefined) {
    const currentBlocks = parseDraftBodyBlocks(draft)
    if (!bodyBlocksEqual(update.bodyBlocks, currentBlocks)) {
      return true
    }
  }

  return false
}

export const buildDraftUpdateData = (
  draft: DraftRecord,
  update: DraftUpdateInput,
) => {
  const data: {
    subject?: string
    previewText?: string | null
    bodyBlocksJson?: string
    recipients?: string[]
    hasSuccessfulTestSend?: boolean
    lastTestSentAt?: Date | null
  } = {}

  if (update.subject !== undefined) {
    data.subject = update.subject
  }

  if (update.previewText !== undefined) {
    data.previewText = update.previewText
  }

  if (update.bodyBlocks !== undefined) {
    data.bodyBlocksJson = serializeEmailBodyBlocksJson(update.bodyBlocks)
  }

  if (update.recipients !== undefined) {
    data.recipients = update.recipients
  }

  if (shouldInvalidateTestSend(draft, update)) {
    data.hasSuccessfulTestSend = false
    data.lastTestSentAt = null
  }

  return data
}

export const validateFinalSendConfirmation = (
  draft: Pick<DraftRecord, 'subject' | 'recipients'>,
  confirmation: FinalSendConfirmation,
): string | null => {
  if (confirmation.confirmedSubject !== draft.subject) {
    return 'confirmation subject does not match draft'
  }

  if (confirmation.confirmedRecipientCount !== draft.recipients.length) {
    return 'confirmation recipient count does not match draft'
  }

  return null
}

export const validateTestSendContent = (
  draft: DraftRecord,
): { ready: boolean; reason: string | null } => {
  if (!draft.subject.trim()) {
    return { ready: false, reason: 'subject is required' }
  }

  const bodyBlocks = parseDraftBodyBlocks(draft)
  const bodyError = validateEmailBodyBlocks(bodyBlocks)
  if (bodyError) {
    return { ready: false, reason: bodyError }
  }

  if (!hasMeaningfulEmailBodyContent(bodyBlocks)) {
    return { ready: false, reason: 'valid body content is required' }
  }

  return { ready: true, reason: null }
}
