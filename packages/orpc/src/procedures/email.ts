import { authed } from '../middleware/auth.ts'
import { base } from '../context.ts'
import { z } from 'zod/v4'
import { sendThankYouEmail, sendEmail } from '@virtality/nodemailer'
import {
  EMAIL_TEMPLATES,
  getTemplateById,
} from '@virtality/ui/template-registry'
import { reactToHTML } from '@virtality/ui/components/email/react-to-html'

const emailSchema = z.string().email()

const parseRecipientEmails = (value: string) =>
  value
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
const sendThankYouEmailProcedure = base
  .route({ path: '/email/send-thank-you', method: 'POST' })
  .input(z.object({ email: z.string() }))
  .handler(async ({ input }) => {
    const { email } = input
    await sendThankYouEmail(email)
  })

const listTemplatesProcedure = authed
  .route({ path: '/email/templates/list', method: 'GET' })
  .handler(async () => {
    return EMAIL_TEMPLATES.map((t) => {
      return {
        id: t.meta.id,
        title: t.meta.title,
        category: t.meta.category,
        subject: t.meta.subject,
      }
    })
  })

const getTemplateProcedure = authed
  .route({ path: '/email/templates/get', method: 'GET' })
  .input(z.object({ templateId: z.string() }))
  .handler(async ({ input }) => {
    const template = getTemplateById(input.templateId)
    if (!template) return null

    return {
      id: template.meta.id,
      title: template.meta.title,
      category: template.meta.category,
      subject: template.meta.subject,
      html: null,
    }
  })

const getTemplatePreviewProcedure = authed
  .route({ path: '/email/templates/preview', method: 'GET' })
  .input(z.object({ templateId: z.string() }))
  .handler(async ({ input }) => {
    const template = getTemplateById(input.templateId)
    if (!template) return null

    const html = await reactToHTML(template.render(template.sampleProps))
    return { html, subject: template.meta.subject }
  })

const sendTemplateProcedure = authed
  .route({ path: '/email/templates/send', method: 'POST' })
  .input(
    z.object({
      templateId: z.string(),
      recipientEmail: z.string().refine(
        (value) => {
          const recipients = parseRecipientEmails(value)
          return (
            recipients.length > 0 &&
            recipients.every((email) => emailSchema.safeParse(email).success)
          )
        },
        {
          message:
            'recipientEmail must be a valid email or comma-separated list of valid emails',
        },
      ),
    }),
  )
  .handler(async ({ input }) => {
    const template = getTemplateById(input.templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    let html: string
    let subject: string

    html = await reactToHTML(template.render(template.sampleProps))
    subject = template.meta.subject

    const recipients = parseRecipientEmails(input.recipientEmail)

    await sendEmail({
      to: recipients.join(', '),
      subject,
      html,
    })

    return { sent: true }
  })

export const email = {
  sendThankYouEmail: sendThankYouEmailProcedure,
  templates: {
    list: listTemplatesProcedure,
    get: getTemplateProcedure,
    preview: getTemplatePreviewProcedure,
    send: sendTemplateProcedure,
  },
}
