import type { ReactElement } from 'react'
import EmailVerification from './email-verification.js'
import ResetPassword from './reset-password.js'
import DeleteUserEmail from './delete-user-email.js'
import WaitingListEmail from './waitinglist-email.js'
import MeetVirtality from './meet-virtality.js'
import ProductUpdate from './product-update.js'
import ProductUpdateV0109 from './product-update-v0-1-09.js'

export type EmailTemplateMeta = {
  id: string
  title: string
  category: string
  subject: string
}

export type SampleProps = Record<string, unknown>

const SAMPLE_URL = 'https://example.com/verify'
const SAMPLE_EMAIL = 'recipient@example.com'

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
      subject: 'Thank you for joining waitlist.',
    },
    sampleProps: {
      firstName: 'John',
      email: SAMPLE_EMAIL,
      companyName: 'Virtality',
      companyUrl: 'https://www.virtality.app',
    },
    render: (p) =>
      WaitingListEmail({
        firstName: p.firstName as string,
        email: p.email as string,
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
]

export function getTemplateById(id: string) {
  return EMAIL_TEMPLATES.find((t) => t.meta.id === id)
}
