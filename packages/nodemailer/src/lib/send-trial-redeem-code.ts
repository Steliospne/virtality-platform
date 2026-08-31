import type { TrialRedeemEmailDelivery } from '@virtality/shared/utils'
import TrialRedeemCodeEmail, {
  TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE,
} from '@virtality/ui/components/email/trial-redeem-code'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import { nodemailer } from '../init.js'

export type SendTrialRedeemCodeEmailData = TrialRedeemEmailDelivery

export async function sendTrialRedeemCodeEmail(
  data: SendTrialRedeemCodeEmailData,
) {
  const { recipientEmail, code, mode, trialDays, ctaVariant, ctaUrl } = data

  const html = await reactToHTML(
    TrialRedeemCodeEmail({
      code,
      mode,
      trialDays,
      ctaUrl,
      ctaVariant,
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
