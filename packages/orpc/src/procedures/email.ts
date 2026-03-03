import { base } from '../context.ts'
import { z } from 'zod/v4'
import { sendThankYouEmail } from '@virtality/nodemailer'

const sendThankYouEmailProcedure = base
  .route({ path: '/email/send-thank-you', method: 'POST' })
  .input(z.object({ email: z.string() }))
  .handler(async ({ input }) => {
    const { email } = input
    await sendThankYouEmail(email)
  })

export const email = {
  sendThankYouEmail: sendThankYouEmailProcedure,
}
