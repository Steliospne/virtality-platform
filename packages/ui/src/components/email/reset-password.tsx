import EmailBase from './templates/email-base.tsx'
import EmailHeader from './templates/email-header.tsx'
import EmailFooter from './templates/email-footer.tsx'
import {
  container,
  content,
  paragraph,
  buttonContainer,
  button,
  divider,
  smallText,
  linkText,
  link,
  warningText,
} from './styles/email.ts'
import {
  Button,
  Container,
  Link,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface ResetPasswordProps {
  url: string
  name?: string
  companyName?: string
}

export const ResetPassword = ({
  name = 'there',
  url,
  companyName = 'Virtality',
}: ResetPasswordProps) => (
  <EmailBase preview='Someone requested a password reset, click to set a new password.'>
    <Container style={container}>
      {/* Header */}
      <EmailHeader />

      {/* Body Content */}
      <Section style={content}>
        <Text style={paragraph}>Hi, {name}</Text>
        <Text style={paragraph}>
          Someone recently requested a password change for your {companyName}{' '}
          account. If this was you, you can set a new password here:
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={url}>
            Reset password
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
          This verification link will expire in 24 hours.
        </Text>

        <Text style={warningText}>
          If you didn't request a password reset, please ignore this email or
          contact support if you have concerns. Your password will remain
          unchanged.
        </Text>
      </Section>

      {/* Footer */}
      <EmailFooter companyName={companyName} />
    </Container>
  </EmailBase>
)

export default ResetPassword
