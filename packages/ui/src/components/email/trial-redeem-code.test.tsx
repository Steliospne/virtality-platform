import { describe, expect, it } from 'vitest'
import { reactToHTML } from '../../lib/react-to-html.js'
import {
  TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE,
  TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE,
  TrialRedeemCodeEmail,
  type TrialRedeemCodeEmailMode,
} from './trial-redeem-code.js'

const SIGN_UP_URL = 'https://console.virtality.app/sign-up'
const CODE = 'GO-ABCDEFGHIJ'

async function renderEmail(
  mode: TrialRedeemCodeEmailMode,
  recipientEmail?: string,
) {
  return reactToHTML(
    TrialRedeemCodeEmail({
      code: CODE,
      mode,
      trialDays: 14,
      signUpUrl: SIGN_UP_URL,
      recipientEmail,
    }),
  )
}

describe('TrialRedeemCodeEmail', () => {
  it('includes trial copy for timed_trial mode', async () => {
    const html = await renderEmail('timed_trial', 'clinician@clinic.example')

    expect(html).toContain(TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE.timed_trial)
    expect(html).toContain(CODE)
    expect(html).toContain('Trial length: 14 days')
    expect(html).toContain(SIGN_UP_URL)
    expect(html).toContain('clinician@clinic.example')
    expect(html).toContain('not bound to this address')
    expect(TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE.timed_trial).toContain(
      'trial',
    )
  })

  it('includes permanent Free copy for permanent_free mode', async () => {
    const html = await renderEmail('permanent_free')

    expect(html).toContain(
      TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE.permanent_free,
    )
    expect(html).toContain('permanent Free access')
    expect(html).not.toContain('Trial length:')
    expect(TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE.permanent_free).toContain(
      'permanent Free',
    )
  })

  it('avoids em dashes in email copy', async () => {
    const html = await renderEmail('timed_trial')

    expect(html).not.toContain('—')
    expect(TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE.timed_trial).not.toContain(
      '—',
    )
    expect(
      TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE.permanent_free,
    ).not.toContain('—')
  })
})
