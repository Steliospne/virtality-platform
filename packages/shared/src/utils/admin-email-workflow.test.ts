import { describe, expect, it } from 'vitest'
import type { EmailBodyBlock } from '../types/admin-email.ts'
import {
  buildDraftUpdateData,
  draftHasFinalSend,
  shouldInvalidateTestSend,
  validateFinalSendConfirmation,
  validateTestSendContent,
} from './admin-email-workflow.ts'
import { serializeEmailBodyBlocksJson } from './admin-email-persistence.ts'

const paragraph = (text: string): EmailBodyBlock => ({
  type: 'paragraph',
  id: 'p1',
  text,
})

const baseDraft = {
  subject: 'June update',
  previewText: 'A quick note',
  bodyBlocksJson: serializeEmailBodyBlocksJson([paragraph('Hello team')]),
  recipients: ['admin@virtality.app'],
  hasSuccessfulTestSend: true,
  sentRecordCount: 0,
}

describe('draftHasFinalSend', () => {
  it('treats drafts with sent records as no longer editable', () => {
    expect(draftHasFinalSend({ ...baseDraft, sentRecordCount: 1 })).toBe(true)
    expect(draftHasFinalSend(baseDraft)).toBe(false)
  })
})

describe('shouldInvalidateTestSend', () => {
  it('invalidates test send when draft content changes', () => {
    expect(
      shouldInvalidateTestSend(baseDraft, {
        subject: 'Updated subject',
      }),
    ).toBe(true)

    expect(
      shouldInvalidateTestSend(baseDraft, {
        bodyBlocks: [paragraph('Changed copy')],
      }),
    ).toBe(true)

    expect(
      shouldInvalidateTestSend(baseDraft, {
        recipients: ['other@virtality.app'],
      }),
    ).toBe(true)
  })

  it('keeps test send state when unrelated fields are unchanged', () => {
    expect(shouldInvalidateTestSend(baseDraft, {})).toBe(false)
  })
})

describe('buildDraftUpdateData', () => {
  it('resets test-send state when content changes', () => {
    expect(
      buildDraftUpdateData(baseDraft, {
        subject: 'Updated subject',
      }),
    ).toEqual({
      subject: 'Updated subject',
      hasSuccessfulTestSend: false,
      lastTestSentAt: null,
    })
  })
})

describe('validateFinalSendConfirmation', () => {
  it('requires matching subject and recipient count', () => {
    expect(
      validateFinalSendConfirmation(baseDraft, {
        confirmedSubject: 'June update',
        confirmedRecipientCount: 1,
      }),
    ).toBeNull()

    expect(
      validateFinalSendConfirmation(baseDraft, {
        confirmedSubject: 'Wrong subject',
        confirmedRecipientCount: 1,
      }),
    ).toMatch(/subject/)

    expect(
      validateFinalSendConfirmation(baseDraft, {
        confirmedSubject: 'June update',
        confirmedRecipientCount: 2,
      }),
    ).toMatch(/recipient count/)
  })
})

describe('validateTestSendContent', () => {
  it('requires subject and valid body blocks before test send', () => {
    expect(validateTestSendContent(baseDraft)).toEqual({
      ready: true,
      reason: null,
    })

    expect(
      validateTestSendContent({
        ...baseDraft,
        subject: '  ',
      }).ready,
    ).toBe(false)
  })
})
