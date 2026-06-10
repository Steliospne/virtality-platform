import { describe, expect, it } from 'vitest'
import {
  formatRecipientsForInput,
  parseRecipientsFromInput,
} from './admin-email-recipients'

describe('parseRecipientsFromInput', () => {
  it('parses newline, comma, and semicolon separated addresses', () => {
    expect(
      parseRecipientsFromInput(
        'one@example.com\ntwo@example.com, three@example.com;four@example.com',
      ),
    ).toEqual([
      'one@example.com',
      'two@example.com',
      'three@example.com',
      'four@example.com',
    ])
  })

  it('trims whitespace and ignores empty lines', () => {
    expect(parseRecipientsFromInput('  a@example.com \n\n  b@example.com  ')).toEqual(
      ['a@example.com', 'b@example.com'],
    )
  })
})

describe('formatRecipientsForInput', () => {
  it('joins recipients with newlines', () => {
    expect(formatRecipientsForInput(['a@example.com', 'b@example.com'])).toBe(
      'a@example.com\nb@example.com',
    )
  })
})
