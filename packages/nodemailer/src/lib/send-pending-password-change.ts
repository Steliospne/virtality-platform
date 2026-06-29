import {
  PendingPasswordChangeEmail,
  getPendingPasswordChangeSubject,
} from '@virtality/ui/components/email/pending-password-change'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import { nodemailer } from '../init.js'
import type { PendingPasswordChangeData } from '../types/auth.js'

export async function sendPendingPasswordChange(
  data: PendingPasswordChangeData,
) {
  const {
    user: { email, name },
    url,
    variant,
  } = data

  const html = await reactToHTML(
    PendingPasswordChangeEmail({ url, name: name ?? undefined, variant }),
  )
  const text = toPlainText(html)

  const subject = getPendingPasswordChangeSubject(variant)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to: email,
    subject,
    html,
    text,
  })
}
