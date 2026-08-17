import PromotionCodeEmail, {
  PROMOTION_CODE_EMAIL_SUBJECT,
} from '@virtality/ui/components/email/promotion-code'
import {
  reactToHTML,
  toPlainText,
} from '@virtality/ui/components/email/react-to-html'
import { nodemailer } from '../init.js'

export type SendPromotionCodeEmailData = {
  recipientEmail: string
  code: string
  billingUrl: string
}

export async function sendPromotionCodeEmail(data: SendPromotionCodeEmailData) {
  const { recipientEmail, code, billingUrl } = data

  const html = await reactToHTML(
    PromotionCodeEmail({
      code,
      billingUrl,
      recipientEmail,
    }),
  )
  const text = toPlainText(html)

  await nodemailer.sendMail({
    from: 'Virtality <hey@mail.virtality.app>',
    to: recipientEmail,
    subject: PROMOTION_CODE_EMAIL_SUBJECT,
    html,
    text,
  })
}
