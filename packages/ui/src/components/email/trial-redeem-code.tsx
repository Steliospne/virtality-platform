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
  ctaUrl: string
  ctaVariant: TrialRedeemCodeEmailCtaVariant
  recipientEmail?: string
  companyName?: string
}

function existingAccountEmailCopy(
  mode: TrialRedeemCodeEmailMode,
  trialDays: number,
) {
  const shared = {
    heading: 'Redeem your Access Code on Billing',
    instructions:
      'Enter this code in the Access Code field on the Billing tab. The code is one-time use and expires one week after it was issued if unused.',
    cta: 'Go to Billing',
  }

  switch (mode) {
    case 'permanent_free':
      return {
        ...shared,
        intro:
          'You already have a Virtality account. Open Profile, then Billing, and apply the code below to unlock permanent Free access.',
        entitlement: 'Access type: permanent Free (no trial period)',
        footer:
          'This code grants permanent Free access. It does not include a paid Pro subscription.',
      }
    case 'timed_trial':
      return {
        ...shared,
        intro:
          'You already have a Virtality account. Open Profile, then Billing, and apply the code below to start your no-card Free trial.',
        entitlement: `Trial length: ${trialDays} days`,
        footer:
          'When the trial ends, your seat stays on the Free plan unless you subscribe to Pro.',
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
        heading: 'Your Access Code unlocks permanent Free access',
        intro:
          'Use the code below when you create your Virtality account. After sign-up you will have permanent Free access with no trial countdown.',
        entitlement: 'Access type: permanent Free (no trial period)',
        instructions,
        cta: 'Create account and redeem',
        footer:
          'This code grants permanent Free access. It does not include a paid Pro subscription.',
      }
    case 'timed_trial':
      return {
        heading: 'Your Access Code unlocks a Free trial',
        intro:
          'Use the code below when you create your Virtality account. After sign-up you will start a no-card Free trial on the Free plan.',
        entitlement: `Trial length: ${trialDays} days`,
        instructions,
        cta: 'Create account and start trial',
        footer:
          'When the trial ends, your seat stays on the Free plan unless you subscribe to Pro.',
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

          <Text style={paragraph}>{copy.entitlement}</Text>

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
