import TrialRedeemCodeEmail, {
  TRIAL_REDEEM_CODE_EMAIL_SUBJECT,
} from '@virtality/ui/components/email/trial-redeem-code'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import { nodemailer } from '../init.js'

export type SendTrialRedeemCodeEmailData = {
  recipientEmail: string
  code: string
  trialDays: number
  signUpUrl: string
}

export async function sendTrialRedeemCodeEmail(
  data: SendTrialRedeemCodeEmailData,
) {
  const { recipientEmail, code, trialDays, signUpUrl } = data

  const html = await reactToHTML(
    TrialRedeemCodeEmail({
      code,
      trialDays,
      signUpUrl,
      recipientEmail,
    }),
  )
  const text = toPlainText(html)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to: recipientEmail,
    subject: TRIAL_REDEEM_CODE_EMAIL_SUBJECT,
    html,
    text,
  })
}
