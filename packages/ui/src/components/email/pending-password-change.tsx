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

export type PendingPasswordChangeVariant = 'setup' | 'change'

interface PendingPasswordChangeEmailProps {
  url: string
  name?: string
  companyName?: string
  variant: PendingPasswordChangeVariant
}

const copyByVariant = {
  setup: {
    preview: 'Approve setting a password on your Virtality account.',
    intro:
      'You requested to set a password for your account so you can sign in with email and password.',
    button: 'Approve password setup',
    warning:
      "If you didn't request to set a password, please ignore this email or contact support if you have concerns. Your account will remain unchanged.",
  },
  change: {
    preview: 'Approve changing the password on your Virtality account.',
    intro: 'You requested to change the password for your account.',
    button: 'Approve password change',
    warning:
      "If you didn't request to change your password, please ignore this email or contact support if you have concerns. Your password will remain unchanged.",
  },
} as const

export const PendingPasswordChangeEmail = ({
  url,
  name = 'there',
  companyName = 'Virtality',
  variant,
}: PendingPasswordChangeEmailProps) => {
  const copy = copyByVariant[variant]

  return (
    <EmailBase preview={copy.preview}>
      <Container style={container}>
        <EmailHeader />

        <Section style={content}>
          <Text style={paragraph}>Hi, {name}</Text>

          <Text style={paragraph}>{copy.intro}</Text>

          <Text style={paragraph}>
            Open the confirmation page and press the approve button to finish.
            This link will not set your password by itself.
          </Text>

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
            This approval link will expire in 30 minutes.
          </Text>

          <Text style={warningText}>{copy.warning}</Text>
        </Section>

        <EmailFooter companyName={companyName} />
      </Container>
    </EmailBase>
  )
}

export default PendingPasswordChangeEmail
