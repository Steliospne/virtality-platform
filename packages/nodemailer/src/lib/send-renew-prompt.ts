import RenewPromptEmail, {
  RENEW_PROMPT_EMAIL_SUBJECT,
} from '@virtality/ui/components/email/renew-prompt'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import { nodemailer } from '../init.js'

export type SendRenewPromptEmailData = {
  recipientEmail: string
  daysBefore: number
  clockEnd: Date
  consoleUrl: string
}

export async function sendRenewPromptEmail(data: SendRenewPromptEmailData) {
  const { recipientEmail, daysBefore, clockEnd, consoleUrl } = data
  const clockEndIso = clockEnd.toISOString()

  const html = await reactToHTML(
    RenewPromptEmail({
      daysBefore,
      clockEndIso,
      consoleUrl,
      recipientEmail,
    }),
  )
  const text = toPlainText(html)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to: recipientEmail,
    subject: RENEW_PROMPT_EMAIL_SUBJECT,
    html,
    text,
  })
}
