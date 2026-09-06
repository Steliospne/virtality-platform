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

/** Mirrors `TrialRedeemCodeMode` in `@virtality/shared` (UI package boundary). */
export type TrialRedeemCodeEmailMode = 'permanent_free' | 'timed_trial'

export type TrialRedeemCodeEmailCtaVariant = 'no_account' | 'existing_account'

const TRIAL_REDEEM_CODE_EMAIL_SUBJECT = 'Your Virtality Access Code'
const TRIAL_REDEEM_CODE_EMAIL_PREVIEW =
  'Redeem your Access Code to explore Virtality.'
const WELCOME_HEADING = 'Welcome to Virtality'
const VR_EXCLUSION_FOOTER =
  "This code doesn't include VR programs or a paid Default subscription."
const TRIAL_END_FOOTER =
  'When your trial ends, you can subscribe to keep going.'

/** Delivery-only Access Code System Email. */
export const TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE: Record<
  TrialRedeemCodeEmailMode,
  string
> = {
  permanent_free: TRIAL_REDEEM_CODE_EMAIL_SUBJECT,
  timed_trial: TRIAL_REDEEM_CODE_EMAIL_SUBJECT,
}

export const TRIAL_REDEEM_CODE_EMAIL_PREVIEW_BY_MODE: Record<
  TrialRedeemCodeEmailMode,
  string
> = {
  permanent_free: TRIAL_REDEEM_CODE_EMAIL_PREVIEW,
  timed_trial: TRIAL_REDEEM_CODE_EMAIL_PREVIEW,
}

export interface TrialRedeemCodeEmailProps {
  code: string
  mode: TrialRedeemCodeEmailMode
  trialDays: number
  ctaUrl: string
  ctaVariant: TrialRedeemCodeEmailCtaVariant
  recipientEmail?: string
  companyName?: string
}

function explorePlatformIntro(
  existingAccount: boolean,
  trialDays?: number,
): string {
  const duration = trialDays != null ? ` for ${trialDays} days` : ''
  if (existingAccount) {
    return `Open Profile, then Billing, and apply the code below to unlock access to explore the platform${duration}.`
  }
  return `Use the code below when you create your account. Redeeming it gives you access to explore the platform${duration}.`
}

function existingAccountEmailCopy(
  mode: TrialRedeemCodeEmailMode,
  trialDays: number,
) {
  const shared = {
    heading: WELCOME_HEADING,
    instructions:
      'Enter this code in the Access Code field on the Billing tab. The code is one-time use and expires one week after it was issued if unused.',
    cta: 'Go to Billing',
  }

  switch (mode) {
    case 'permanent_free':
      return {
        ...shared,
        intro: explorePlatformIntro(true),
        footer: VR_EXCLUSION_FOOTER,
      }
    case 'timed_trial':
      return {
        ...shared,
        intro: explorePlatformIntro(true, trialDays),
        footer: TRIAL_END_FOOTER,
      }
  }
}

function newAccountEmailCopy(
  mode: TrialRedeemCodeEmailMode,
  trialDays: number,
) {
  const instructions =
    'Enter this code in the Redeem code field on the sign-up page. The code is one-time use and expires one week after it was issued if unused.'

  switch (mode) {
    case 'permanent_free':
      return {
        heading: WELCOME_HEADING,
        intro: explorePlatformIntro(false),
        instructions,
        cta: 'Create account and redeem',
        footer: VR_EXCLUSION_FOOTER,
      }
    case 'timed_trial':
      return {
        heading: WELCOME_HEADING,
        intro: explorePlatformIntro(false, trialDays),
        instructions,
        cta: 'Create account and start trial',
        footer: TRIAL_END_FOOTER,
      }
  }
}

function emailCopy(
  mode: TrialRedeemCodeEmailMode,
  trialDays: number,
  ctaVariant: TrialRedeemCodeEmailCtaVariant,
) {
  if (ctaVariant === 'existing_account') {
    return existingAccountEmailCopy(mode, trialDays)
  }

  return newAccountEmailCopy(mode, trialDays)
}

export const TrialRedeemCodeEmail = ({
  code,
  mode,
  trialDays,
  ctaUrl,
  ctaVariant,
  recipientEmail,
  companyName = 'Virtality',
}: TrialRedeemCodeEmailProps) => {
  const copy = emailCopy(mode, trialDays, ctaVariant)
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

          <Text style={text}>{copy.instructions}</Text>

          <Section style={buttonContainer}>
            <Button style={button} href={ctaUrl}>
              {copy.cta}
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={smallText}>
            If the button doesn&apos;t work, copy and paste this link into your
            browser:
          </Text>

          <Text style={linkText}>
            <Link href={ctaUrl} style={link}>
              {ctaUrl}
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
