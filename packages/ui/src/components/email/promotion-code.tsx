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

/** Delivery-only Promotion Code System Email. Marketing strings stay [COPY]. */
export const PROMOTION_CODE_EMAIL_SUBJECT = '[COPY]'
export const PROMOTION_CODE_EMAIL_PREVIEW = '[COPY]'

export interface PromotionCodeEmailProps {
  code: string
  billingUrl: string
  recipientEmail?: string
  companyName?: string
}

export const PromotionCodeEmail = ({
  code,
  billingUrl,
  recipientEmail,
  companyName = 'Virtality',
}: PromotionCodeEmailProps) => (
  <EmailBase preview={PROMOTION_CODE_EMAIL_PREVIEW}>
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
          Your Promotion Code:{' '}
          <strong style={{ letterSpacing: '0.04em' }}>{code}</strong>
        </Text>

        <Text style={text}>
          [COPY] Open Console Profile → Billing and enter the code.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={billingUrl}>
            [COPY]
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={smallText}>
          If the button doesn&apos;t work, copy and paste this link into your
          browser:
        </Text>

        <Text style={linkText}>
          <Link href={billingUrl} style={link}>
            {billingUrl}
          </Link>
        </Text>

        {recipientEmail ? (
          <Text style={smallText}>
            This email was sent to {recipientEmail}. The code is not bound to
            this address.
          </Text>
        ) : null}

        <Text style={smallText}>[COPY]</Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </Container>
  </EmailBase>
)

export default PromotionCodeEmail
