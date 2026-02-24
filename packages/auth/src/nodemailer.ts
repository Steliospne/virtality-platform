import nodemailer from 'nodemailer'

if (
  !process.env.SMTP_HOST ||
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS
) {
  throw new Error(
    'Missing required SMTP environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS',
  )
}

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  secure: true,
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})
