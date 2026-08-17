import { describe, expect, it } from 'vitest'
import { reactToHTML } from '../../lib/react-to-html.js'
import {
  PROMOTION_CODE_EMAIL_PREVIEW,
  PROMOTION_CODE_EMAIL_SUBJECT,
  PromotionCodeEmail,
} from './promotion-code.js'

const BILLING_URL = 'https://console.virtality.app/'
const CODE = 'SAVE20'

async function renderEmail(recipientEmail?: string) {
  return reactToHTML(
    PromotionCodeEmail({
      code: CODE,
      billingUrl: BILLING_URL,
      recipientEmail,
    }),
  )
}

describe('PromotionCodeEmail', () => {
  it('includes the Promotion Code and delivery-only recipient note', async () => {
    const html = await renderEmail('clinician@clinic.example')

    expect(html).toContain(PROMOTION_CODE_EMAIL_PREVIEW)
    expect(html).toContain(CODE)
    expect(html).toContain(BILLING_URL)
    expect(html).toContain('clinician@clinic.example')
    expect(html).toContain('not bound')
    expect(PROMOTION_CODE_EMAIL_SUBJECT).toBe('[COPY]')
  })
})
