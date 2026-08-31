import {
  PendingAccountDeletionEmail,
  PENDING_ACCOUNT_DELETION_SUBJECT,
} from '@virtality/ui/components/email/pending-account-deletion'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import { nodemailer } from '../init.js'
import type { PendingAccountDeletionData } from '../types/auth.js'

export async function sendPendingAccountDeletion(
  data: PendingAccountDeletionData,
) {
  const {
    user: { email, name },
    url,
  } = data

  const html = await reactToHTML(
    PendingAccountDeletionEmail({ url, name: name ?? undefined }),
  )
  const text = toPlainText(html)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to: email,
    subject: PENDING_ACCOUNT_DELETION_SUBJECT,
    html,
    text,
  })
}
