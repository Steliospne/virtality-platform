import { describe, expect, it } from 'vitest'
import {
  buildEmailOptOutUrl,
  signEmailOptOutToken,
  verifyEmailOptOutToken,
} from './opt-out-token.ts'

const secret = 'test-secret'

describe('opt-out token', () => {
  it('round-trips a payload and lower-cases the email', () => {
    const token = signEmailOptOutToken(
      { email: 'Person@Example.com', scope: 'newsletter' },
      secret,
    )
    expect(verifyEmailOptOutToken(token, secret)).toEqual({
      email: 'person@example.com',
      scope: 'newsletter',
    })
  })

  it('rejects a tampered body or a different secret', () => {
    const token = signEmailOptOutToken(
      { email: 'person@example.com', scope: 'all' },
      secret,
    )
    const [body, signature] = token.split('.')
    const forgedBody = Buffer.from(
      JSON.stringify({ e: 'other@example.com', s: 'all' }),
    ).toString('base64url')

    expect(verifyEmailOptOutToken(`${forgedBody}.${signature}`, secret)).toBe(
      null,
    )
    expect(verifyEmailOptOutToken(`${body}.${signature}`, 'other')).toBe(null)
    expect(verifyEmailOptOutToken('garbage', secret)).toBe(null)
  })

  it('builds a website link carrying the token', () => {
    expect(buildEmailOptOutUrl('https://www.virtality.app/', 'a.b')).toBe(
      'https://www.virtality.app/email-preferences?token=a.b',
    )
  })
})
