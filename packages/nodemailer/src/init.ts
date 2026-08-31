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
// to a real inbox. A new account is minted on every process boot, and its
// webmail inbox is opened once here (server boot) rather than per email sent.
const testAccount = isEmailLocalTesting
  ? await Nodemailer.createTestAccount()
  : undefined

if (testAccount) {
  console.log(
    `[email:local-testing] Ethereal inbox: log in at ${testAccount.web} with user "${testAccount.user}" / pass "${testAccount.pass}"`,
  )
  await open(testAccount.web)
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
  : Nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      secure: true,
      port: 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
