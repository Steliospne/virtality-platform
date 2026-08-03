import WaitingListEmail, {
  DEFAULT_WAITLIST_ONBOARDING_URL,
  WAITING_LIST_EMAIL_SUBJECT,
} from '@virtality/ui/components/email/waitinglist-email'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import { nodemailer } from '../init.js'

export const sendThankYouEmail = async (email: string) => {
  const onboardingUrl =
    process.env.WAITLIST_ONBOARDING_URL?.trim() ||
    DEFAULT_WAITLIST_ONBOARDING_URL
  const html = await reactToHTML(WaitingListEmail({ email, onboardingUrl }))
  const text = toPlainText(html)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    replyTo: 'info@virtality.app',
    to: email,
    subject: WAITING_LIST_EMAIL_SUBJECT,
    html,
    text,
  })
}
