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
  link,
  linkText,
  paragraph,
  smallText,
  text,
} from './styles/email.js'

/** Renew prompt System Email subject for a given offset. */
export function renewPromptEmailSubject(daysBefore: number): string {
  if (daysBefore === 1) return 'Your Virtality access renews tomorrow'
  return `Your Virtality access renews in ${daysBefore} days`
}

/** Inbox preview line for a given offset. */
export function renewPromptEmailPreview(daysBefore: number): string {
  if (daysBefore === 1) {
    return 'Remaining Time ends tomorrow. Review billing in the console.'
  }
  return `Remaining Time: about ${daysBefore} days left. Review billing in the console.`
}

export function renewPromptEmailHeading(daysBefore: number): string {
  if (daysBefore === 1) return 'Your access renews tomorrow'
  return `Your access renews in ${daysBefore} days`
}

/** @deprecated Prefer renewPromptEmailSubject(daysBefore). */
export const RENEW_PROMPT_EMAIL_SUBJECT = renewPromptEmailSubject(3)
/** @deprecated Prefer renewPromptEmailPreview(daysBefore). */
export const RENEW_PROMPT_EMAIL_PREVIEW = renewPromptEmailPreview(3)

export interface RenewPromptEmailProps {
  daysBefore: number
  /** Clinician-facing Remaining Time, e.g. "6d 14h". */
  remainingTimeLabel: string
  /** Human-readable Entitlement Clock end, e.g. "17 Aug 2026, 12:00 UTC". */
  clockEndLabel: string
  /** Deep link into console Billing (or console home). */
  actionUrl: string
  recipientEmail?: string
  companyName?: string
}

export const RenewPromptEmail = ({
  daysBefore,
  remainingTimeLabel,
  clockEndLabel,
  actionUrl,
  recipientEmail,
  companyName = 'Virtality',
}: RenewPromptEmailProps) => (
  <EmailBase preview={renewPromptEmailPreview(daysBefore)}>
    <Container style={container}>
      <EmailHeader />

      <Section style={content}>
        <Heading
          className='heading-main'
          style={{
            fontSize: '28px',
            fontWeight: '700',
            lineHeight: '1.3',
            color: '#2d3748',
            marginBottom: '24px',
            marginTop: '0',
          }}
        >
          {renewPromptEmailHeading(daysBefore)}
        </Heading>

        <Text style={text}>Hi there,</Text>

        <Text style={text}>
          Your Virtality Remaining Time is running low. Review your plan and
          billing before access ends so VR sessions stay uninterrupted.
        </Text>

        <Text style={paragraph}>
          Remaining Time:{' '}
          <strong style={{ letterSpacing: '0.02em' }}>
            {remainingTimeLabel}
          </strong>
        </Text>

        <Text style={smallText}>{`Ends: ${clockEndLabel}`}</Text>

        <Section style={buttonContainer}>
          <Button style={button} href={actionUrl}>
            Manage billing
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={smallText}>
          If the button doesn&apos;t work, copy and paste this link into your
          browser:
        </Text>

        <Text style={linkText}>
          <Link href={actionUrl} style={link}>
            {actionUrl}
          </Link>
        </Text>

        {recipientEmail ? (
          <Text style={smallText}>
            This email was sent to {recipientEmail}.
          </Text>
        ) : null}

        <Text style={smallText}>
          You received this because a renew reminder is configured for your
          seat. If you already renewed, you can ignore this message.
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </Container>
  </EmailBase>
)

export default RenewPromptEmail
