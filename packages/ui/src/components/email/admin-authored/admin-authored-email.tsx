import { Container } from 'react-email'
import EmailBase from '../templates/email-base.js'
import EmailHeader from '../templates/email-header.js'
import EmailFooter from '../templates/email-footer.js'
import { container } from '../styles/email.js'
import {
  EmailBodyBlocks,
  type AdminEmailBodyBlock,
} from './email-body-blocks.js'
import {
  AdminEmailOptOutFooter,
  type AdminEmailOptOutLinks,
} from './admin-email-opt-out-footer.js'

export interface AdminAuthoredEmailProps {
  subject: string
  previewText?: string
  bodyBlocks: AdminEmailBodyBlock[]
  /** Omitted for preview-only renders; every delivered email carries it. */
  optOut?: AdminEmailOptOutLinks
  companyName?: string
}

export const AdminAuthoredEmail = ({
  subject,
  previewText,
  bodyBlocks,
  optOut,
  companyName = 'Virtality',
}: AdminAuthoredEmailProps) => {
  return (
    <EmailBase preview={previewText ?? subject}>
      <Container className='container' style={container}>
        <EmailHeader />
        <EmailBodyBlocks blocks={bodyBlocks} />
        <EmailFooter companyName={companyName}>
          {optOut ? <AdminEmailOptOutFooter {...optOut} /> : null}
        </EmailFooter>
      </Container>
    </EmailBase>
  )
}
