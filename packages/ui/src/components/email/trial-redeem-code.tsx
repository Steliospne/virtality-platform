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

export type TrialRedeemCodeEmailMode = 'permanent_free' | 'timed_trial'

/** Delivery-only Access Code System Email. */
export const TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE: Record<
  TrialRedeemCodeEmailMode,
  string
> = {
  permanent_free: 'Your Virtality Access Code: permanent Free access',
  timed_trial: 'Your Virtality Access Code: Free trial access',
}

export const TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE: Record<
  TrialRedeemCodeEmailMode,
  string
> = {
  permanent_free: 'Redeem your Access Code for permanent Free access.',
  timed_trial: 'Redeem your Access Code to start a Free trial.',
}

export interface TrialRedeemCodeEmailProps {
  code: string
  mode: TrialRedeemCodeEmailMode
  trialDays: number
  signUpUrl: string
  recipientEmail?: string
  companyName?: string
}

function emailCopy(mode: TrialRedeemCodeEmailMode, trialDays: number) {
  if (mode === 'permanent_free') {
    return {
      heading: 'Your Access Code unlocks permanent Free access',
      intro:
        'Use the code below when you create your Virtality account. After sign-up you will have permanent Free access with no trial countdown.',
      entitlement: 'Access type: permanent Free (no trial period)',
      cta: 'Create account and redeem',
      footer:
        'This code grants permanent Free access. It does not include a paid Pro subscription.',
    }
  }

  return {
    heading: 'Your Access Code unlocks a Free trial',
    intro:
      'Use the code below when you create your Virtality account. After sign-up you will start a no-card Free trial on the Free plan.',
    entitlement: `Trial length: ${trialDays} days`,
    cta: 'Create account and start trial',
    footer:
      'When the trial ends, your seat stays on the Free plan unless you subscribe to Pro.',
  }
}

export const TrialRedeemCodeEmail = ({
  code,
  mode,
  trialDays,
  signUpUrl,
  recipientEmail,
  companyName = 'Virtality',
}: TrialRedeemCodeEmailProps) => {
  const copy = emailCopy(mode, trialDays)
  const preview = TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE[mode]

  return (
    <EmailBase preview={preview}>
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
            {copy.heading}
          </Heading>

          <Text style={text}>{copy.intro}</Text>

          <Text style={paragraph}>
            Your Access Code:{' '}
            <strong style={{ letterSpacing: '0.04em' }}>{code}</strong>
          </Text>

          <Text style={paragraph}>{copy.entitlement}</Text>

          <Text style={text}>
            Enter this code in the Redeem code field on the sign-up page. The
            code is one-time use and expires one week after it was issued if
            unused.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={signUpUrl}>
              {copy.cta}
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={smallText}>
            If the button doesn&apos;t work, copy and paste this link into your
            browser:
          </Text>

          <Text style={linkText}>
            <Link href={signUpUrl} style={link}>
              {signUpUrl}
            </Link>
          </Text>

          {recipientEmail ? (
            <Text style={smallText}>
              This email was sent to {recipientEmail}. The code is not bound to
              this address.
            </Text>
          ) : null}

          <Text style={smallText}>{copy.footer}</Text>
        </Section>

        <EmailFooter companyName={companyName} />
      </Container>
    </EmailBase>
  )
}

export default TrialRedeemCodeEmail
