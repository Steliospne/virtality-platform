import EmailBase from './templates/email-base.tsx'
import EmailHeader from './templates/email-header.tsx'
import EmailFooter from './templates/email-footer.tsx'
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
} from './styles/email.ts'
import {
  Button,
  Container,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components'

const DeleteUserEmail = ({
  url,
  name = 'there',
  companyName = 'Virtality',
}: {
  url: string
  name?: string
  companyName?: string
}) => {
  return (
    <EmailBase preview='Delete your account, this action is permanent.'>
      <Container style={container}>
        {/* Header */}
        <EmailHeader />

        {/* Body Content */}
        <Section style={content}>
          <Text style={paragraph}>Hi, {name}</Text>

          <Text style={paragraph}>
            We received a request to delete your account associated with{' '}
            {companyName}. Deleting your account is permanent — all your data,
            settings, and activity will be erased and cannot be recovered.
          </Text>

          <Text style={paragraph}>
            If you requested this, please confirm your deletion by clicking the
            button below:
          </Text>

          <Section style={buttonContainer}>
            <Button style={destructive} href={url}>
              Delete account
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
            If you didn't request to delete your account, please ignore this
            email or contact support if you have concerns. Your account will
            remain active.
          </Text>
        </Section>

        {/* Footer */}
        <EmailFooter companyName={companyName} />
      </Container>
    </EmailBase>
  )
}

export default DeleteUserEmail
