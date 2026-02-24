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
} from './styles/email.ts'
import {
  Button,
  Container,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components'

const EmailVerification = ({
  url,
  companyName = 'Virtality',
}: {
  url: string
  companyName?: string
}) => {
  return (
    <EmailBase preview='Verify your email address to complete your registration'>
      <Container style={container}>
        {/* Header */}
        <EmailHeader />

        {/* Body Content */}
        <Section style={content}>
          <Text style={paragraph}>
            Thank you for signing up with {companyName}! To complete your
            registration and ensure the security of your account, please verify
            your email address by clicking the button below.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              Verify Email Address
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

          <Text style={smallText}>
            If you didn't create an account with {companyName}, you can safely
            ignore this email.
          </Text>
        </Section>

        {/* Footer */}
        <EmailFooter companyName={companyName} />
      </Container>
    </EmailBase>
  )
}

export default EmailVerification
