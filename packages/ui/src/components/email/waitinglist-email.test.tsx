import { describe, expect, it } from 'vitest'
import { reactToHTML } from '../../lib/react-to-html.js'
import {
  WAITING_LIST_EMAIL_PREVIEW,
  WAITING_LIST_EMAIL_SUBJECT,
  WaitingListEmail,
} from './waitinglist-email.js'

const ONBOARDING_URL = 'https://cal.com/virtality'
const COMPANY_URL = 'https://www.virtality.app'

async function renderEmail() {
  return reactToHTML(
    WaitingListEmail({
      email: 'customer@example.com',
      onboardingUrl: ONBOARDING_URL,
      companyUrl: COMPANY_URL,
    }),
  )
}

describe('WaitingListEmail', () => {
  it('renders the welcome and onboarding copy', async () => {
    const html = await renderEmail()

    expect(html).toContain(WAITING_LIST_EMAIL_PREVIEW)
    expect(html).toContain('Hi there,')
    expect(html).toContain('What happens next?')
    expect(html).toContain('Book your onboarding session')
    expect(html).toContain('Virtality team')
  })

  it('links to onboarding and the Virtality website', async () => {
    const html = await renderEmail()

    expect(html).toContain(ONBOARDING_URL)
    expect(html).toContain(COMPANY_URL)
  })

  it('uses the approved subject with a regular hyphen', () => {
    expect(WAITING_LIST_EMAIL_SUBJECT).toBe(
      'Welcome to Virtality - book your onboarding session',
    )
    expect(WAITING_LIST_EMAIL_SUBJECT).not.toContain('—')
  })
})
