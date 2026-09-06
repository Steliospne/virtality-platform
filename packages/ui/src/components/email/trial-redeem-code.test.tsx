import { describe, expect, it } from 'vitest'
import { reactToHTML } from '../../lib/react-to-html.js'
import {
  TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE,
  TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE,
  TrialRedeemCodeEmail,
  type TrialRedeemCodeEmailCtaVariant,
  type TrialRedeemCodeEmailMode,
} from './trial-redeem-code.js'

const SIGN_UP_URL =
  'https://console.virtality.app/sign-up?access_code=GO-ABCDEFGHIJ'
const BILLING_URL =
  'https://console.virtality.app/user/user-123/profile?tab=billing&access_code=GO-ABCDEFGHIJ'
const CODE = 'GO-ABCDEFGHIJ'

async function renderEmail(
  mode: TrialRedeemCodeEmailMode,
  options: {
    ctaVariant?: TrialRedeemCodeEmailCtaVariant
    ctaUrl?: string
    recipientEmail?: string
  } = {},
) {
  const ctaVariant = options.ctaVariant ?? 'no_account'
  const ctaUrl =
    options.ctaUrl ??
    (ctaVariant === 'existing_account' ? BILLING_URL : SIGN_UP_URL)

  return reactToHTML(
    TrialRedeemCodeEmail({
      code: CODE,
      mode,
      trialDays: 14,
      ctaUrl,
      ctaVariant,
      recipientEmail: options.recipientEmail,
    }),
  )
}

describe('TrialRedeemCodeEmail', () => {
  it('uses warm welcome copy for timed_trial mode', async () => {
    const html = await renderEmail('timed_trial', {
      recipientEmail: 'clinician@clinic.example',
    })

    expect(html).toContain(TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE.timed_trial)
    expect(html).toContain('Welcome to Virtality')
    expect(html).toContain('14 days')
    expect(html).toContain(CODE)
    expect(html).toContain(SIGN_UP_URL)
    expect(html).toContain('Create account and start trial')
    expect(html).toContain('sign-up page')
    expect(html).toContain('When your trial ends')
    expect(html).not.toContain('Go to Billing')
    expect(html).not.toContain('Free plan')
    expect(html).not.toContain('Free trial')
    expect(html).not.toContain('Trial length:')
    expect(html).toContain('clinician@clinic.example')
    expect(html).toContain('not bound to this address')
    expect(TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE.timed_trial).toBe(
      'Your Virtality Access Code',
    )
  })

  it('uses warm welcome copy for permanent_free mode', async () => {
    const html = await renderEmail('permanent_free')

    expect(html).toContain(
      TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE.permanent_free,
    )
    expect(html).toContain('Welcome to Virtality')
    expect(html).toContain('explore the')
    expect(html).toContain('include VR programs')
    expect(html).toContain('Create account and redeem')
    expect(html).not.toContain('Trial length:')
    expect(html).not.toContain('Free plan')
    expect(html).not.toContain('Free trial')
    expect(TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE.permanent_free).toBe(
      'Your Virtality Access Code',
    )
  })

  it('renders a billing CTA for existing accounts', async () => {
    const html = await renderEmail('timed_trial', {
      ctaVariant: 'existing_account',
    })

    expect(html).toContain('Welcome to Virtality')
    expect(html).toContain('Open Profile, then Billing')
    expect(html).toContain('14 days')
    expect(html).toContain('Billing tab')
    expect(html).toContain('/user/user-123/profile?tab=billing')
    expect(html).toContain('access_code=GO-ABCDEFGHIJ')
    expect(html).toContain('Go to Billing')
    expect(html).not.toContain('Create account and start trial')
    expect(html).not.toContain('sign-up page')
    expect(html).not.toContain('Free plan')
    expect(html).not.toContain('Free trial')
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
