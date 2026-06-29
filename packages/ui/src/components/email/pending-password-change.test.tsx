import { describe, expect, it } from 'vitest'
import { reactToHTML } from '../../lib/react-to-html.js'
import {
  PENDING_PASSWORD_CHANGE_VARIANTS,
  PendingPasswordChangeEmail,
  getPendingPasswordChangeSubject,
  pendingPasswordChangeApprovalExpiryNotice,
  pendingPasswordChangeCopyByVariant,
  type PendingPasswordChangeVariant,
} from './pending-password-change.js'

const SAMPLE_URL =
  'https://console.virtality.app/password-setup/confirm?token=abc'

const normalizeHtml = (html: string) => html.replace(/\s+/g, ' ').trim()

const RESET_RECOVERY_PHRASES = [
  'reset your password',
  'password reset',
  'account recovery',
  'forgot your password',
  'verification link',
]

const COMPLETION_EMAIL_PHRASES = [
  'you will receive',
  'we will send',
  'confirmation email',
  'completion email',
]

async function renderVariant(variant: PendingPasswordChangeVariant) {
  return normalizeHtml(
    await reactToHTML(
      PendingPasswordChangeEmail({
        url: SAMPLE_URL,
        name: 'Alex',
        variant,
      }),
    ),
  )
}

describe('PendingPasswordChangeEmail', () => {
  it.each(PENDING_PASSWORD_CHANGE_VARIANTS)(
    'renders a button and fallback link for the %s variant',
    async (variant) => {
      const html = await renderVariant(variant)
      const copy = pendingPasswordChangeCopyByVariant[variant]

      expect(html).toContain(copy.button)
      expect(html).toContain(SAMPLE_URL)
      expect(html).toContain('If the button doesn&#x27;t work')
    },
  )

  it('uses setup-specific copy for first-time password setup', async () => {
    const html = await renderVariant('setup')
    const copy = pendingPasswordChangeCopyByVariant.setup

    expect(html).toContain(copy.preview)
    expect(html).toContain(copy.intro)
    expect(html).toContain(copy.approvalInstruction)
    expect(html).toContain(copy.button)
    expect(html).not.toContain('change your password')
  })

  it('uses change-specific copy for existing-password changes', async () => {
    const html = await renderVariant('change')
    const copy = pendingPasswordChangeCopyByVariant.change

    expect(html).toContain(copy.preview)
    expect(html).toContain(copy.intro)
    expect(html).toContain(copy.approvalInstruction)
    expect(html).toContain(copy.button)
    expect(html).not.toContain('set a password')
  })

  it.each(PENDING_PASSWORD_CHANGE_VARIANTS)(
    'avoids reset and recovery language in the %s variant',
    async (variant) => {
      const html = (await renderVariant(variant)).toLowerCase()

      for (const phrase of RESET_RECOVERY_PHRASES) {
        expect(html).not.toContain(phrase)
      }
    },
  )

  it.each(PENDING_PASSWORD_CHANGE_VARIANTS)(
    'requires explicit approval before the password takes effect for the %s variant',
    async (variant) => {
      const html = await renderVariant(variant)
      const copy = pendingPasswordChangeCopyByVariant[variant]

      expect(html).toContain(copy.approvalInstruction)
      expect(html).toContain(pendingPasswordChangeApprovalExpiryNotice)
    },
  )

  it.each(PENDING_PASSWORD_CHANGE_VARIANTS)(
    'does not imply a follow-up completion email for the %s variant',
    async (variant) => {
      const html = (await renderVariant(variant)).toLowerCase()

      for (const phrase of COMPLETION_EMAIL_PHRASES) {
        expect(html).not.toContain(phrase)
      }
    },
  )

  it.each(PENDING_PASSWORD_CHANGE_VARIANTS)(
    'uses the %s subject line from copy',
    (variant) => {
      expect(getPendingPasswordChangeSubject(variant)).toBe(
        pendingPasswordChangeCopyByVariant[variant].subject,
      )
    },
  )
})
