import { Container } from '@react-email/components'
import EmailBase from '../templates/email-base.js'
import EmailHeader from '../templates/email-header.js'
import EmailFooter from '../templates/email-footer.js'
import { container } from '../styles/email.js'
import {
  EmailBodyBlocks,
  type AdminEmailBodyBlock,
} from './email-body-blocks.js'

export interface AdminAuthoredEmailProps {
  subject: string
  previewText?: string
  bodyBlocks: AdminEmailBodyBlock[]
  companyName?: string
}

export const AdminAuthoredEmail = ({
  subject,
  previewText,
  bodyBlocks,
  companyName = 'Virtality',
}: AdminAuthoredEmailProps) => {
  return (
    <EmailBase preview={previewText ?? subject}>
      <Container className='container' style={container}>
        <EmailHeader />
        <EmailBodyBlocks blocks={bodyBlocks} />
        <EmailFooter companyName={companyName} />
      </Container>
    </EmailBase>
  )
}
