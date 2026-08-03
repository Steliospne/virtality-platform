import {
  Button,
  Container,
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from 'react-email'
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
  link,
  listItem,
  sectionHeading,
  smallText,
  text,
} from './styles/email.js'

export const WAITING_LIST_EMAIL_SUBJECT =
  'Welcome to Virtality - book your onboarding session'
export const WAITING_LIST_EMAIL_PREVIEW =
  'Schedule your personalized orientation with the Virtality team.'
export const DEFAULT_WAITLIST_ONBOARDING_URL = 'https://cal.com/virtality'

export interface WaitingListEmailProps {
  email: string
  onboardingUrl?: string
  companyName?: string
  companyUrl?: string
}

export const WaitingListEmail = ({
  email,
  onboardingUrl = DEFAULT_WAITLIST_ONBOARDING_URL,
  companyName = 'Virtality',
  companyUrl = 'https://www.virtality.app',
}: WaitingListEmailProps) => (
  <EmailBase preview={WAITING_LIST_EMAIL_PREVIEW}>
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
          Welcome to Virtality!
        </Heading>

        <Text style={text}>Hi there,</Text>

        <Text style={text}>We&apos;re thrilled to have you with us.</Text>

        <Text style={text}>
          You&apos;ve joined us at an exciting time. We&apos;ve officially moved
          beyond our pilot phase and are now onboarding our next cohort of users
          through a direct, high-touch process. This is designed to help you get
          the most value from Virtality from day one.
        </Text>

        <Heading style={sectionHeading}>What happens next?</Heading>

        <Text style={text}>
          To tailor the experience to your specific goals, your onboarding
          includes a personalized one-to-one or live group online orientation
          session with our team.
        </Text>

        <Text style={text}>In this session, we will:</Text>

        <Text style={listItem}>
          • Walk you through the core features tailored to your workflow.
        </Text>
        <Text style={listItem}>
          • Set up your account together so you can hit the ground running.
        </Text>
        <Text style={listItem}>
          • Answer any specific questions you have right from the start.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={onboardingUrl}>
            Book your onboarding session
          </Button>
        </Section>

        <Text style={smallText}>
          If none of the available times work for you, reply to this email and
          let us know what fits your schedule.
        </Text>

        <Text style={text}>
          We can&apos;t wait to meet you and help you get started.
        </Text>

        <Text style={text}>
          Best regards,
          <br />
          {companyName} team
          <br />
          <Link href={companyUrl} style={link}>
            www.virtality.app
          </Link>
        </Text>

        <Hr style={divider} />

        <Text style={footerText}>
          {`This email was sent to ${email}. If you didn't sign up for our waiting list, you can safely ignore this email.`}
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </Container>
  </EmailBase>
)

export default WaitingListEmail
