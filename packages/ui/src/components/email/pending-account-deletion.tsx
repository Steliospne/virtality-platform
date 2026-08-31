import EmailBase from './templates/email-base.js'
import EmailHeader from './templates/email-header.js'
import EmailFooter from './templates/email-footer.js'
import {
  container,
  content,
  paragraph,
  buttonContainer,
  destructive,
  divider,
  smallText,
  linkText,
  link,
  warningText,
} from './styles/email.js'
import { Button, Container, Hr, Link, Section, Text } from 'react-email'

export const pendingAccountDeletionApprovalExpiryNotice =
  'This approval link will expire in 30 minutes.'

export const PENDING_ACCOUNT_DELETION_SUBJECT =
  'Approve account deletion - Action required'

interface PendingAccountDeletionEmailProps {
  url: string
  name?: string
  companyName?: string
}

export const PendingAccountDeletionEmail = ({
  url,
  name = 'there',
  companyName = 'Virtality',
}: PendingAccountDeletionEmailProps) => {
  return (
    <EmailBase preview='Approve deleting your Virtality account.'>
      <Container style={container}>
        <EmailHeader />

        <Section style={content}>
          <Text style={paragraph}>Hi, {name}</Text>

          <Text style={paragraph}>
            You started deleting your account associated with {companyName}.
            Deleting your account is permanent — all your data, settings, and
            activity will be erased and cannot be recovered.
          </Text>

          <Text style={paragraph}>
            Use the button below to open the confirmation page. You must press
            Approve there before your account is deleted. Opening this link
            alone will not delete your account.
          </Text>

          <Section style={buttonContainer}>
            <Button style={destructive} href={url}>
              Approve account deletion
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={smallText}>
            If the button doesn't work, copy and paste this link into your
            browser:
          </Text>

          <Text style={linkText}>
            <Link href={url} style={link}>
              {url}
            </Link>
          </Text>

          <Text style={smallText}>
            {pendingAccountDeletionApprovalExpiryNotice}
          </Text>

          <Text style={warningText}>
            If you didn't request to delete your account, ignore this email or
            contact support if you have concerns. Your account will remain
            active.
          </Text>
        </Section>

        <EmailFooter companyName={companyName} />
      </Container>
    </EmailBase>
  )
}

export default PendingAccountDeletionEmail
