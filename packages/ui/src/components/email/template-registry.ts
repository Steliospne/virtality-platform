import type { ReactElement } from 'react'
import EmailVerification from './email-verification.js'
import ResetPassword from './reset-password.js'
import DeleteUserEmail from './delete-user-email.js'
import WaitingListEmail, {
  WAITING_LIST_EMAIL_SUBJECT,
} from './waitinglist-email.js'
import MeetVirtality from './meet-virtality.js'
import ProductUpdate from './product-update.js'
import ProductUpdateV0109 from './product-update-v0-1-09.js'
import PendingPasswordChangeEmail, {
  getPendingPasswordChangeSubject,
  type PendingPasswordChangeVariant,
} from './pending-password-change.js'
import TrialRedeemCodeEmail, {
  TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE,
} from './trial-redeem-code.js'
import PromotionCodeEmail, {
  PROMOTION_CODE_EMAIL_SUBJECT,
} from './promotion-code.js'
import RenewPromptEmail, { renewPromptEmailSubject } from './renew-prompt.js'

export type EmailTemplateMeta = {
  id: string
  title: string
  category: string
  subject: string
}

export type SampleProps = Record<string, unknown>

const SAMPLE_URL = 'https://example.com/verify'
const SAMPLE_EMAIL = 'recipient@example.com'

function createPendingPasswordChangeTemplate(
  variant: PendingPasswordChangeVariant,
  titleLabel: string,
) {
  return {
    meta: {
      id: `pending-password-change-${variant}`,
      title: `Pending Password Change (${titleLabel})`,
      category: 'auth',
      subject: getPendingPasswordChangeSubject(variant),
    },
    sampleProps: {
      url: SAMPLE_URL,
      name: 'John',
      companyName: 'Virtality',
      variant,
    },
    render: (p: SampleProps) =>
      PendingPasswordChangeEmail({
        url: p.url as string,
        name: p.name as string,
        companyName: p.companyName as string,
        variant,
      }),
  }
}

export const EMAIL_TEMPLATES: {
  meta: EmailTemplateMeta
  sampleProps: SampleProps
  render: (props: SampleProps) => ReactElement
}[] = [
  {
    meta: {
      id: 'email-verification',
      title: 'Email Verification',
      category: 'auth',
      subject: 'Verify your email address',
    },
    sampleProps: { url: SAMPLE_URL, companyName: 'Virtality' },
    render: (p) =>
      EmailVerification({
        url: p.url as string,
        companyName: p.companyName as string,
      }),
  },
  {
    meta: {
      id: 'reset-password',
      title: 'Reset Password',
      category: 'auth',
      subject: 'Reset your password',
    },
    sampleProps: { url: SAMPLE_URL, name: 'John', companyName: 'Virtality' },
    render: (p) =>
      ResetPassword({
        url: p.url as string,
        name: p.name as string,
        companyName: p.companyName as string,
      }),
  },
  {
    meta: {
      id: 'delete-user-email',
      title: 'Delete Account',
      category: 'auth',
      subject: 'Confirm account deletion',
    },
    sampleProps: { url: SAMPLE_URL, name: 'John', companyName: 'Virtality' },
    render: (p) =>
      DeleteUserEmail({
        url: p.url as string,
        name: p.name as string,
        companyName: p.companyName as string,
      }),
  },
  {
    meta: {
      id: 'waitinglist-email',
      title: 'Thank You (Waitlist)',
      category: 'marketing',
      subject: WAITING_LIST_EMAIL_SUBJECT,
    },
    sampleProps: {
      email: SAMPLE_EMAIL,
      onboardingUrl: 'https://cal.com/virtality',
      companyName: 'Virtality',
      companyUrl: 'https://www.virtality.app',
    },
    render: (p) =>
      WaitingListEmail({
        email: p.email as string,
        onboardingUrl: p.onboardingUrl as string,
        companyName: p.companyName as string,
        companyUrl: p.companyUrl as string,
      }),
  },
  {
    meta: {
      id: 'meet-virtality',
      title: 'Meet Virtality',
      category: 'marketing',
      subject: 'Meet Virtality',
    },
    sampleProps: { companyName: 'Virtality' },
    render: (p) => MeetVirtality({ companyName: p.companyName as string }),
  },
  {
    meta: {
      id: 'product-update',
      title: 'Product Update (with GIFs)',
      category: 'marketing',
      subject: 'Product Update — Patch v0.1.08',
    },
    sampleProps: {
      companyName: 'Virtality',
      gifRomOffUrl: '',
      gifRomOnUrl: '',
      gifCastUrl: '',
      gifSittingUrl: '',
    },
    render: (p) =>
      ProductUpdate({
        companyName: p.companyName as string,
      }),
  },
  createPendingPasswordChangeTemplate('setup', 'Setup'),
  createPendingPasswordChangeTemplate('change', 'Change'),
  {
    meta: {
      id: 'product-update-v0-1-09',
      title: 'Product Update - Patch v0.1.09',
      category: 'marketing',
      subject: 'Product Update - Patch v0.1.09',
    },
    sampleProps: {
      companyName: 'Virtality',
    },
    render: (p) =>
      ProductUpdateV0109({
        companyName: p.companyName as string,
      }),
  },
  {
    meta: {
      id: 'trial-redeem-code',
      title: 'Access Code',
      category: 'billing',
      subject: TRIAL_REDEEM_CODE_EMAIL_SUBJECT_BY_MODE.timed_trial,
    },
    sampleProps: {
      code: 'GO-ABCDEFGHIJ',
      mode: 'timed_trial',
      trialDays: 14,
      signUpUrl: 'https://console.virtality.app/sign-up',
      recipientEmail: SAMPLE_EMAIL,
      companyName: 'Virtality',
    },
    render: (p) =>
      TrialRedeemCodeEmail({
        code: p.code as string,
        mode: (p.mode as 'permanent_free' | 'timed_trial') ?? 'timed_trial',
        trialDays: p.trialDays as number,
        signUpUrl: p.signUpUrl as string,
        recipientEmail: p.recipientEmail as string | undefined,
        companyName: p.companyName as string,
      }),
  },
  {
    meta: {
      id: 'promotion-code',
      title: 'Promotion Code',
      category: 'billing',
      subject: PROMOTION_CODE_EMAIL_SUBJECT,
    },
    sampleProps: {
      code: 'SAVE20',
      billingUrl: 'https://console.virtality.app/',
      recipientEmail: SAMPLE_EMAIL,
      companyName: 'Virtality',
    },
    render: (p) =>
      PromotionCodeEmail({
        code: p.code as string,
        billingUrl: p.billingUrl as string,
        recipientEmail: p.recipientEmail as string | undefined,
        companyName: p.companyName as string,
      }),
  },
  {
    meta: {
      id: 'renew-prompt',
      title: 'Renew Prompt',
      category: 'billing',
      subject: renewPromptEmailSubject(3),
    },
    sampleProps: {
      daysBefore: 3,
      remainingTimeLabel: '2d 18h',
      clockEndLabel: '17 Aug 2026, 12:00 UTC',
      actionUrl:
        'https://console.virtality.app/user/sample/profile?tab=billing',
      recipientEmail: SAMPLE_EMAIL,
      companyName: 'Virtality',
    },
    render: (p) =>
      RenewPromptEmail({
        daysBefore: p.daysBefore as number,
        remainingTimeLabel: p.remainingTimeLabel as string,
        clockEndLabel: p.clockEndLabel as string,
        actionUrl: p.actionUrl as string,
        recipientEmail: p.recipientEmail as string | undefined,
        companyName: p.companyName as string,
      }),
  },
]

export function getTemplateById(id: string) {
  return EMAIL_TEMPLATES.find((t) => t.meta.id === id)
}
