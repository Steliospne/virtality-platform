import RenewPromptEmail, {
  renewPromptEmailSubject,
} from '@virtality/ui/components/email/renew-prompt'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import {
  formatEntitlementClockEndLabel,
  formatRemainingTimeLabel,
} from '@virtality/shared/utils'
import { nodemailer } from '../init.js'

export type SendRenewPromptEmailData = {
  recipientEmail: string
  daysBefore: number
  clockEnd: Date
  /** Deep link to console Billing (or console home). */
  actionUrl: string
  /** Optional override for tests; defaults to Date.now(). */
  now?: Date
}

export async function sendRenewPromptEmail(data: SendRenewPromptEmailData) {
  const { recipientEmail, daysBefore, clockEnd, actionUrl } = data
  const now = data.now ?? new Date()
  const remainingTimeLabel = formatRemainingTimeLabel(
    clockEnd.getTime() - now.getTime(),
  )
  const clockEndLabel = formatEntitlementClockEndLabel(clockEnd)

  const html = await reactToHTML(
    RenewPromptEmail({
      daysBefore,
      remainingTimeLabel,
      clockEndLabel,
      actionUrl,
      recipientEmail,
    }),
  )
  const text = toPlainText(html)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to: recipientEmail,
    subject: renewPromptEmailSubject(daysBefore),
    html,
    text,
  })
}
