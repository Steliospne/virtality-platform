import * as Nodemailer from 'nodemailer'
import { toPlainText } from '@virtality/ui/components/email/react-to-html'
import { isEmailLocalTesting, nodemailer } from '../init.js'

export type SendEmailOptions = {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  const text = toPlainText(html)

  const info = await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to,
    subject,
    html,
    text,
  })

  if (isEmailLocalTesting) {
    console.log(
      `[email:local-testing] "${subject}" to ${to}: preview ${Nodemailer.getTestMessageUrl(info)}`,
    )
  }
}
