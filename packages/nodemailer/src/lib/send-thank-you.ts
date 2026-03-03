import WaitingListEmail from '@virtality/ui/components/email/waitinglist-email'
import { nodemailer } from '../init.js'
import { reactToHTML } from '../utils/react-to-html.js'
import { toPlainText } from '@react-email/render'

export const sendThankYouEmail = async (email: string) => {
  const html = await reactToHTML(WaitingListEmail({ email }))
  const text = toPlainText(html)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to: email,
    subject: 'Thank you for joining waitlist.',
    html,
    text,
  })
}
