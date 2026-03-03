import {
  Container,
  Heading,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components'
import EmailFooter from './templates/email-footer.js'
import EmailHeader from './templates/email-header.js'
import EmailBase from './templates/email-base.js'
import {
  button,
  buttonContainer,
  container,
  content,
  divider,
  footerText,
  smallText,
  text,
} from './styles/email.js'

export interface WaitingListEmailProps {
  firstName?: string
  email: string
  companyName?: string
  companyUrl?: string
}

export const WaitingListEmail = ({
  firstName = 'there',
  email,
  companyName = 'Virtality',
  companyUrl = 'https://www.virtality.app',
}: WaitingListEmailProps) => (
  <EmailBase>
    <Container style={container}>
      <EmailHeader />

      <Section style={content}>
        <Heading
          style={{
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '1.3',
            color: '#2d3748',
            marginBottom: '24px',
            marginTop: '0',
          }}
        >
          Welcome to the waiting list!
        </Heading>

        <Text style={text}>Hi {firstName},</Text>

        <Text style={text}>
          {`Thank you for joining our waiting list! We're excited to have you on board and can't wait share what we're building.`}
        </Text>

        <Text style={text}>
          <strong>What happens next?</strong>
        </Text>

        <Text style={text}>
          {`• We'll keep you updated on our progress.`}
          <br />
          {`• You'll be among the first to know when we launch.`}
          <br />
          {`• Early access members get special rewards.`}
          <br />
          {`• No spam, just the good stuff!`}
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={companyUrl}>
            Visit Our Website
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={smallText}>
          {`Questions? Just reply to this email - we'd love to hear from you!`}
        </Text>

        <Text style={footerText}>
          {`This email was sent to ${email}. If you didn't sign up for our waiting list, you can safely ignore this email.`}
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </Container>
  </EmailBase>
)

export default WaitingListEmail
