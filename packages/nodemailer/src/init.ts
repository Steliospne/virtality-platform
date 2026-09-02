import * as Nodemailer from 'nodemailer'
import open from 'open'

export const isEmailLocalTesting = process.env.EMAIL_LOCAL_TESTING === 'true'

if (
  !isEmailLocalTesting &&
  (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS)
) {
  throw new Error(
    'Missing required SMTP environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS',
  )
}

// EMAIL_LOCAL_TESTING=true swaps the real SMTP transport for a throwaway
// Ethereal test account so local dev never needs real SMTP creds or sends
// to a real inbox. Prefer SMTP_HOST/SMTP_USER/SMTP_PASS already persisted in
// .env (written once by `pnpm dev:ethereal`, see
// packages/nodemailer/scripts/ethereal-dev.ts) so the same inbox and its
// history survive server restarts. Only mint a fresh account - and open its
// webmail here - when nothing has been persisted yet.
const hasPersistedSmtpCreds =
  isEmailLocalTesting &&
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS

const testAccount =
  isEmailLocalTesting && !hasPersistedSmtpCreds
    ? await Nodemailer.createTestAccount()
    : undefined

if (testAccount) {
  console.log(
    `[email:local-testing] Ethereal inbox: log in at ${testAccount.web} with user "${testAccount.user}" / pass "${testAccount.pass}". Run "pnpm dev:ethereal" to persist this across restarts.`,
  )
  await open(testAccount.web)
} else if (hasPersistedSmtpCreds) {
  console.log(
    `[email:local-testing] Ethereal inbox: reusing persisted account "${process.env.SMTP_USER}". Log in at https://ethereal.email/login`,
  )
}

export const nodemailer = testAccount
  ? Nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  : isEmailLocalTesting
    ? Nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : Nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        secure: true,
        port: 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
