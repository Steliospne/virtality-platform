import { describe, expect, it } from 'vitest'
import { reactToHTML } from '../../lib/react-to-html.js'
import {
  renewPromptEmailPreview,
  renewPromptEmailSubject,
  RenewPromptEmail,
} from './renew-prompt.js'

const ACTION_URL = 'https://console.virtality.app/user/abc/profile?tab=billing'
const CLOCK_END_LABEL = '17 Aug 2026, 12:00 UTC'
const REMAINING = '2d 18h'

async function renderEmail(recipientEmail?: string) {
  return reactToHTML(
    RenewPromptEmail({
      daysBefore: 3,
      remainingTimeLabel: REMAINING,
      clockEndLabel: CLOCK_END_LABEL,
      actionUrl: ACTION_URL,
      recipientEmail,
    }),
  )
}

describe('renewPromptEmailSubject', () => {
  it('uses tomorrow wording for the 1-day offset', () => {
    expect(renewPromptEmailSubject(1)).toBe(
      'Your Virtality access renews tomorrow',
    )
  })

  it('includes the day count for other offsets', () => {
    expect(renewPromptEmailSubject(7)).toBe(
      'Your Virtality access renews in 7 days',
    )
  })
})

describe('RenewPromptEmail', () => {
  it('renders Remaining Time, clock end, and billing CTA for the seat holder', async () => {
    const html = await renderEmail('seat@clinic.example')
    const preview = renewPromptEmailPreview(3)

    expect(html).toContain(preview)
    expect(html).toContain('Your access renews in 3 days')
    expect(html).toContain('Remaining Time:')
    expect(html).toContain(REMAINING)
    expect(html).toContain(`Ends: ${CLOCK_END_LABEL}`)
    expect(html).toContain('Manage billing')
    expect(html).toContain(ACTION_URL)
    expect(html).toContain('seat@clinic.example')
    expect(html).not.toContain('[COPY]')
    expect(html).not.toContain('—')
    expect(renewPromptEmailSubject(3)).not.toContain('—')
    expect(preview).not.toContain('—')
  })
})
