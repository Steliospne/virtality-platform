import { AdminAuthoredEmail } from '../components/email/admin-authored/admin-authored-email.js'
import { reactToHTML } from './react-to-html.js'
import type { AdminEmailBodyBlock } from '../components/email/admin-authored/email-body-blocks.js'

export type RenderAdminAuthoredEmailInput = {
  subject: string
  previewText?: string
  bodyBlocks: AdminEmailBodyBlock[]
}

export type RenderedAdminAuthoredEmail = {
  subject: string
  html: string
}

export const renderAdminAuthoredEmail = async (
  input: RenderAdminAuthoredEmailInput,
): Promise<RenderedAdminAuthoredEmail> => {
  const html = await reactToHTML(
    <AdminAuthoredEmail
      subject={input.subject}
      previewText={input.previewText}
      bodyBlocks={input.bodyBlocks}
    />,
  )

  return {
    subject: input.subject,
    html,
  }
}
