import { Email } from '@/app/email/page'
import { SERVER_URL, SERVER_URL_LOCAL } from '@virtality/shared/types'

const baseURL =
  process.env.NODE_ENV === 'production' ? SERVER_URL : SERVER_URL_LOCAL

export const getEmails = async () => {
  const res = await fetch(`${baseURL}/api/v1/email`)
  const { payload } = (await res.json()) as { payload: Email[] }
  return payload
}

export const sendEmail = async ({
  recipientEmail,
  emailId,
}: {
  recipientEmail: string
  emailId?: string | number
}) => {
  await fetch(`${baseURL}/api/v1/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emailId, email: recipientEmail }),
  })
}
