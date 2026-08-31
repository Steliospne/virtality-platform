import { describe, expect, it } from 'vitest'
import { resolveTrialRedeemEmailCta } from './trial-redeem-email-url.ts'

const CONSOLE_URL = 'https://console.virtality.app'
const CODE = 'GO-ABCDEFGHIJ'
const USER_ID = 'user-abc-123'

describe('resolveTrialRedeemEmailCta', () => {
  it('returns sign-up CTA when no account is found', () => {
    expect(resolveTrialRedeemEmailCta(CONSOLE_URL, CODE, null)).toEqual({
      ctaVariant: 'no_account',
      ctaUrl: `${CONSOLE_URL}/sign-up?access_code=${CODE}`,
    })
  })

  it('returns billing CTA when an account is found', () => {
    expect(resolveTrialRedeemEmailCta(CONSOLE_URL, CODE, USER_ID)).toEqual({
      ctaVariant: 'existing_account',
      ctaUrl: `${CONSOLE_URL}/user/${USER_ID}/profile?tab=billing&access_code=${CODE}&src=email`,
    })
  })
})
