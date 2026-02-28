'use server'
import { ContactForm, SlackMessage, WaitlistFormType } from '@/types/models'
import { WaitlistFormSchema } from './definitions'
import { prisma } from '@virtality/db'
import { v4 as uuid } from 'uuid'
import resend from '@/resend'
import WaitingListEmail from '@/components/email/waitinglist-email'
import { sendSlackMessage } from './server-utils'

export const submitWaitlistAction = async (
  state: {
    success: boolean | null
    exists: boolean
    values: {
      email: string
    }
  },
  formData: FormData,
) => {
  if (!formData) return state
  const entries = Object.fromEntries(formData)

  const { email, plan } = entries as unknown as WaitlistFormType

  const validateFields = WaitlistFormSchema.safeParse({
    email,
  })

  if (validateFields.success) {
    const exists =
      (await prisma.waitingList.findFirst({ where: { email } })) !== null

    if (!exists) {
      const newListItem = {
        id: uuid(),
        ...validateFields.data,
        plan,
        createdAt: new Date(),
      }
      await prisma.waitingList.create({ data: newListItem })
      await resend.emails.send({
        from: 'info@virtality.app',
        to: newListItem.email,
        subject: 'Thank you for joining waitlist.',
        react: WaitingListEmail({ email }),
      })
      return { ...state, success: true }
    }
    return { exists: true, success: false, values: validateFields.data }
  }

  return { ...state, success: false }
}

export const submitContactMsg = async (
  state: ContactForm,
  formData: FormData,
) => {
  if (!formData) return state

  const slackWebhookUrl = process.env.SLACK_MESSAGE_WEBHOOK_URL

  if (!slackWebhookUrl) {
    console.error('SLACK_MESSAGE_WEBHOOK_URL environment variable is not set')
    throw new Error('Slack webhook URL is not configured')
  }

  const entries = Object.fromEntries(formData) as ContactForm
  const { firstName, lastName, email, phone, message } = entries

  const slackMessage: SlackMessage = {
    text: 'New Appointment Booking',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '✉️ New Client Message',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${firstName} ${lastName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Phone:*\n${phone}`,
          },
          {
            type: 'mrkdwn',
            text: `*Message:*\n${message}`,
          },
        ],
      },
    ],
  }

  await sendSlackMessage(slackWebhookUrl, slackMessage, 'contact')
  return entries
}

// export const submitContactMsg = async (formData: FormData) => {};
