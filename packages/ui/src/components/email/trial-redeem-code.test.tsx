import { describe, expect, it } from 'vitest'
import { reactToHTML } from '../../lib/react-to-html.js'
import {
  TRIAL_REDEEM_CODE_EMAIL_PREVIEW,
  TRIAL_REDEEM_CODE_EMAIL_SUBJECT,
  TrialRedeemCodeEmail,
} from './trial-redeem-code.js'

const SIGN_UP_URL = 'https://console.virtality.app/sign-up'
const CODE = 'GO-ABCDEFGHIJ'

async function renderEmail(recipientEmail?: string) {
  return reactToHTML(
    TrialRedeemCodeEmail({
      code: CODE,
      trialDays: 14,
      signUpUrl: SIGN_UP_URL,
      recipientEmail,
    }),
  )
}

describe('TrialRedeemCodeEmail', () => {
  it('includes the redeem code, trial length, and sign-up link', async () => {
    const html = await renderEmail('clinician@clinic.example')

    expect(html).toContain(TRIAL_REDEEM_CODE_EMAIL_PREVIEW)
    expect(html).toContain(CODE)
    expect(html).toContain('Trial length:')
    expect(html).toContain('14')
    expect(html).toContain(SIGN_UP_URL)
    expect(html).toContain('clinician@clinic.example')
    expect(html).toContain('not bound to this address')
  })

  it('keeps marketing copy as [COPY] placeholders without em dashes', async () => {
    const html = await renderEmail()

    expect(html).toContain('[COPY]')
    expect(html).not.toContain('—')
    expect(TRIAL_REDEEM_CODE_EMAIL_SUBJECT).not.toContain('—')
    expect(TRIAL_REDEEM_CODE_EMAIL_PREVIEW).not.toContain('—')
  })
})
