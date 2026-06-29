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
import {
  Button,
  Container,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components'

export const PENDING_PASSWORD_CHANGE_VARIANTS = ['setup', 'change'] as const

export type PendingPasswordChangeVariant =
  (typeof PENDING_PASSWORD_CHANGE_VARIANTS)[number]

export const pendingPasswordChangeApprovalExpiryNotice =
  'This approval link will expire in 30 minutes.'

interface PendingPasswordChangeEmailProps {
  url: string
  name?: string
  companyName?: string
  variant: PendingPasswordChangeVariant
}

export const pendingPasswordChangeCopyByVariant = {
  setup: {
    preview: 'Approve setting a password on your Virtality account.',
    intro:
      'You started adding a password to your Virtality account so you can also sign in with email and password.',
    approvalInstruction:
      'Use the button below to open the confirmation page. You must press Approve there before your password is set. Opening this link alone will not set your password.',
    button: 'Approve password setup',
    warning:
      "If you didn't request to add a password, ignore this email or contact support if you have concerns. Your account will remain unchanged.",
    subject: 'Approve password setup - Action required',
  },
  change: {
    preview: 'Approve changing your Virtality account password.',
    intro: 'You started a password change for your Virtality account.',
    approvalInstruction:
      'Use the button below to open the confirmation page. You must press Approve there before your new password takes effect. Opening this link alone will not change your password.',
    button: 'Approve password change',
    warning:
      "If you didn't request a password change, ignore this email or contact support if you have concerns. Your current password will remain unchanged.",
    subject: 'Approve password change - Action required',
  },
} as const

export const getPendingPasswordChangeSubject = (
  variant: PendingPasswordChangeVariant,
) => pendingPasswordChangeCopyByVariant[variant].subject

export const PendingPasswordChangeEmail = ({
  url,
  name = 'there',
  companyName = 'Virtality',
  variant,
}: PendingPasswordChangeEmailProps) => {
  const copy = pendingPasswordChangeCopyByVariant[variant]

  return (
    <EmailBase preview={copy.preview}>
      <Container style={container}>
        <EmailHeader />

        <Section style={content}>
          <Text style={paragraph}>Hi, {name}</Text>

          <Text style={paragraph}>{copy.intro}</Text>

          <Text style={paragraph}>{copy.approvalInstruction}</Text>

          <Section style={buttonContainer}>
            <Button style={destructive} href={url}>
              {copy.button}
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
            {pendingPasswordChangeApprovalExpiryNotice}
          </Text>

          <Text style={warningText}>{copy.warning}</Text>
        </Section>

        <EmailFooter companyName={companyName} />
      </Container>
    </EmailBase>
  )
}

export default PendingPasswordChangeEmail
