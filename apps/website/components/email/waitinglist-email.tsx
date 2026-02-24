import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from '@react-email/components'

export interface WaitingListEmailProps {
  firstName?: string
  email?: string
  companyName?: string
  companyUrl?: string
}

export const WaitingListEmail = ({
  firstName = 'there',
  email,
  companyName = 'Virtality',
  companyUrl = 'https://www.virtality.app',
}: WaitingListEmailProps) => (
  <Html>
    <Head />
    <Preview>{"You're on the waiting list! Here's what happens next."}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>
            <Img
              alt='Company Logo'
              height={50}
              src='https://www.virtality.app/logo_full_white.png'
            ></Img>
            <span style={{ flex: '1 1 0%', marginLeft: '4rem' }}>
              {companyName}
            </span>
          </Heading>
        </Section>

        <Section style={content}>
          <Heading style={h2}>Welcome to the waiting list!</Heading>

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

          <Section style={buttonSection}>
            <Button style={button} href={companyUrl}>
              Visit Our Website
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footerText}>
            {`Questions? Just reply to this email - we'd love to hear from you!`}
          </Text>

          {email && (
            <Text style={smallText}>
              {`This email was sent to ${email}. If you didn't sign up for our waiting list, you can safely ignore this email.`}
            </Text>
          )}
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            <Link href={companyUrl} style={link}>
              {companyName}
            </Link>
            <br />
            Building the future of rehabilitation.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WaitingListEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#08899a',
}

const content = {
  padding: '0 24px',
}

const h1 = {
  display: 'flex',
  alignItems: 'center',
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
}

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  padding: '0 24px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const smallText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}
