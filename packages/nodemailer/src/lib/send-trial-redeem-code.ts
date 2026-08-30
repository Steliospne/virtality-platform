import TrialRedeemCodeEmail, {
  TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE,
} from '@virtality/ui/components/email/trial-redeem-code'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import { nodemailer } from '../init.js'

export type SendTrialRedeemCodeEmailData = {
  recipientEmail: string
  code: string
  mode: 'permanent_free' | 'timed_trial'
  trialDays: number
  signUpUrl: string
}

export async function sendTrialRedeemCodeEmail(
  data: SendTrialRedeemCodeEmailData,
) {
  const { recipientEmail, code, mode, trialDays, signUpUrl } = data

  const html = await reactToHTML(
    TrialRedeemCodeEmail({
      code,
      mode,
      trialDays,
      signUpUrl,
      recipientEmail,
    }),
  )
  const text = toPlainText(html)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to: recipientEmail,
    subject: TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE[mode],
    html,
    text,
  })
}
