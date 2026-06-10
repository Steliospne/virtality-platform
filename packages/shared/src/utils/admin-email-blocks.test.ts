import { describe, expect, it } from 'vitest'
import type { EmailBodyBlock } from '../types/admin-email.ts'
import {
  hasMeaningfulEmailBodyContent,
  validateEmailBodyBlock,
  validateEmailBodyBlocks,
  validateEmailRecipientList,
} from './admin-email-blocks.ts'
import { assessEmailSendReadiness } from './admin-email-send-readiness.ts'

const heading = (text: string): EmailBodyBlock => ({
  type: 'heading',
  id: 'h1',
  text,
  level: 2,
})

const paragraph = (text: string): EmailBodyBlock => ({
  type: 'paragraph',
  id: 'p1',
  text,
})

describe('validateEmailBodyBlock', () => {
  it('requires non-empty heading text', () => {
    expect(validateEmailBodyBlock(heading('  '))).toMatch(/heading text/)
  })

  it('requires non-empty paragraph text', () => {
    expect(validateEmailBodyBlock(paragraph(''))).toMatch(/paragraph text/)
  })

  it('requires a valid bucket object key and alt text for image blocks', () => {
    expect(
      validateEmailBodyBlock({
        type: 'image',
        id: 'img1',
        objectKey: '/unsafe.jpg',
        alt: 'Hero',
      }),
    ).toMatch(/object key/)

    expect(
      validateEmailBodyBlock({
        type: 'image',
        id: 'img1',
        objectKey: 'images/hero.jpg',
        alt: '  ',
      }),
    ).toMatch(/alt text/)
  })

  it('requires https button labels and valid hrefs', () => {
    expect(
      validateEmailBodyBlock({
        type: 'button',
        id: 'btn1',
        label: '  ',
        href: 'https://virtality.app',
      }),
    ).toMatch(/button label/)

    expect(
      validateEmailBodyBlock({
        type: 'button',
        id: 'btn1',
        label: 'Learn more',
        href: 'not-a-url',
      }),
    ).toMatch(/button href/)
  })

  it('requires at least one non-empty list item', () => {
    expect(
      validateEmailBodyBlock({
        type: 'list',
        id: 'list1',
        items: ['', '  '],
        ordered: false,
      }),
    ).toMatch(/list item/)
  })

  it('requires card blocks to include meaningful content', () => {
    expect(
      validateEmailBodyBlock({
        type: 'card',
        id: 'card1',
      }),
    ).toMatch(/card content/)

    expect(
      validateEmailBodyBlock({
        type: 'card',
        id: 'card1',
        heading: 'Update',
        buttonLabel: 'Read more',
      }),
    ).toMatch(/button href/)
  })

  it('accepts valid blocks', () => {
    expect(validateEmailBodyBlock(heading('Product update'))).toBeNull()
    expect(
      validateEmailBodyBlock({
        type: 'image',
        id: 'img1',
        objectKey: 'email/assets/hero.jpg',
        alt: 'Hero image',
      }),
    ).toBeNull()
    expect(
      validateEmailBodyBlock({
        type: 'card',
        id: 'card1',
        heading: 'Feature',
        body: 'Details here',
        imageObjectKey: 'email/assets/feature.jpg',
        imageAlt: 'Feature',
        buttonLabel: 'Try it',
        buttonHref: 'https://console.virtality.app',
      }),
    ).toBeNull()
    expect(
      validateEmailBodyBlock({
        type: 'divider',
        id: 'divider1',
      }),
    ).toBeNull()
  })
})

describe('validateEmailBodyBlocks', () => {
  it('rejects unknown block shapes', () => {
    expect(
      validateEmailBodyBlocks([
        { type: 'paragraph', id: 'p1', text: 'Hello' },
        { type: 'unknown', id: 'x1' },
      ] as EmailBodyBlock[]),
    ).toMatch(/invalid block/)
  })

  it('reports the first invalid block', () => {
    expect(
      validateEmailBodyBlocks([
        paragraph('Hello'),
        paragraph(''),
      ]),
    ).toMatch(/paragraph text/)
  })
})

describe('hasMeaningfulEmailBodyContent', () => {
  it('requires at least one block with meaningful content', () => {
    expect(hasMeaningfulEmailBodyContent([])).toBe(false)
    expect(hasMeaningfulEmailBodyContent([{ type: 'divider', id: 'd1' }])).toBe(
      false,
    )
    expect(hasMeaningfulEmailBodyContent([paragraph('Hello')])).toBe(true)
  })
})

describe('validateEmailRecipientList', () => {
  it('accepts up to 50 unique valid recipients', () => {
    const recipients = Array.from(
      { length: 50 },
      (_, index) => `user${index}@example.com`,
    )

    expect(validateEmailRecipientList(recipients)).toBeNull()
  })

  it('rejects empty, duplicate, invalid, or oversized lists', () => {
    expect(validateEmailRecipientList([])).toMatch(/recipient/)
    expect(
      validateEmailRecipientList([
        'user@example.com',
        'user@example.com',
      ]),
    ).toMatch(/duplicate/)
    expect(validateEmailRecipientList(['not-an-email'])).toMatch(/invalid email/)
    expect(
      validateEmailRecipientList(
        Array.from({ length: 51 }, (_, index) => `user${index}@example.com`),
      ),
    ).toMatch(/50/)
  })
})

describe('assessEmailSendReadiness', () => {
  const readyDraft = {
    subject: 'June update',
    bodyBlocks: [paragraph('Hello team')],
    recipients: ['admin@virtality.app'],
    hasSuccessfulTestSend: true,
  }

  it('reports a send-ready draft when all requirements pass', () => {
    expect(assessEmailSendReadiness(readyDraft)).toEqual({
      ready: true,
      reasons: [],
    })
  })

  it('requires subject, valid body, recipients, and a successful test send', () => {
    expect(
      assessEmailSendReadiness({
        ...readyDraft,
        subject: '  ',
      }).reasons,
    ).toContain('subject is required')

    expect(
      assessEmailSendReadiness({
        ...readyDraft,
        bodyBlocks: [{ type: 'divider', id: 'd1' }],
      }).ready,
    ).toBe(false)

    expect(
      assessEmailSendReadiness({
        ...readyDraft,
        recipients: [],
      }).reasons,
    ).toContain('recipient list is required')

    expect(
      assessEmailSendReadiness({
        ...readyDraft,
        hasSuccessfulTestSend: false,
      }).reasons,
    ).toContain('successful test send is required')
  })
})
