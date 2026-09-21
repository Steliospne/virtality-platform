import { AdminAuthoredEmail } from '../components/email/admin-authored/admin-authored-email.js'
import { reactToHTML } from './react-to-html.js'
import type { AdminEmailBodyBlock } from '../components/email/admin-authored/email-body-blocks.js'
import type { AdminEmailOptOutLinks } from '../components/email/admin-authored/admin-email-opt-out-footer.js'

export type { AdminEmailOptOutLinks }

export type RenderAdminAuthoredEmailInput = {
  subject: string
  previewText?: string
  bodyBlocks: AdminEmailBodyBlock[]
  /** Opt-out footer links; omit for preview renders. */
  optOut?: AdminEmailOptOutLinks
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
      optOut={input.optOut}
    />,
  )

  return {
    subject: input.subject,
    html,
  }
}
