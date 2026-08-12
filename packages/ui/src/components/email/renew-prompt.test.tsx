import { describe, expect, it } from 'vitest'
import { reactToHTML } from '../../lib/react-to-html.js'
import {
  RENEW_PROMPT_EMAIL_PREVIEW,
  RENEW_PROMPT_EMAIL_SUBJECT,
  RenewPromptEmail,
} from './renew-prompt.js'

const CONSOLE_URL = 'https://console.virtality.app'
const CLOCK_END = '2026-08-17T12:00:00.000Z'

async function renderEmail(recipientEmail?: string) {
  return reactToHTML(
    RenewPromptEmail({
      daysBefore: 3,
      clockEndIso: CLOCK_END,
      consoleUrl: CONSOLE_URL,
      recipientEmail,
    }),
  )
}

describe('RenewPromptEmail', () => {
  it('includes days-before, clock end, and console link for the seat holder', async () => {
    const html = await renderEmail('seat@clinic.example')

    expect(html).toContain(RENEW_PROMPT_EMAIL_PREVIEW)
    expect(html).toContain('Days before Entitlement Clock end:')
    expect(html).toContain('3')
    expect(html).toContain(CLOCK_END)
    expect(html).toContain(CONSOLE_URL)
    expect(html).toContain('seat@clinic.example')
  })

  it('keeps marketing copy as [COPY] placeholders without em dashes', async () => {
    const html = await renderEmail()

    expect(html).toContain('[COPY]')
    expect(html).not.toContain('—')
    expect(RENEW_PROMPT_EMAIL_SUBJECT).not.toContain('—')
    expect(RENEW_PROMPT_EMAIL_PREVIEW).not.toContain('—')
  })
})
