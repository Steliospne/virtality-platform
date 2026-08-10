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

/** Renew prompt System Email. Marketing strings stay [COPY]. */
export const RENEW_PROMPT_EMAIL_SUBJECT = '[COPY]'
export const RENEW_PROMPT_EMAIL_PREVIEW = '[COPY]'

export interface RenewPromptEmailProps {
  daysBefore: number
  clockEndIso: string
  consoleUrl: string
  recipientEmail?: string
  companyName?: string
}

export const RenewPromptEmail = ({
  daysBefore,
  clockEndIso,
  consoleUrl,
  recipientEmail,
  companyName = 'Virtality',
}: RenewPromptEmailProps) => (
  <EmailBase preview={RENEW_PROMPT_EMAIL_PREVIEW}>
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
          [COPY]
        </Heading>

        <Text style={text}>[COPY]</Text>

        <Text style={paragraph}>
          Days before Entitlement Clock end: {daysBefore}
        </Text>

        <Text style={smallText}>Clock end: {clockEndIso}</Text>

        <Section style={buttonContainer}>
          <Button style={button} href={consoleUrl}>
            [COPY]
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={smallText}>
          If the button doesn&apos;t work, copy and paste this link into your
          browser:
        </Text>

        <Text style={linkText}>
          <Link href={consoleUrl} style={link}>
            {consoleUrl}
          </Link>
        </Text>

        {recipientEmail ? (
          <Text style={smallText}>
            This email was sent to {recipientEmail}.
          </Text>
        ) : null}

        <Text style={smallText}>[COPY]</Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </Container>
  </EmailBase>
)

export default RenewPromptEmail
