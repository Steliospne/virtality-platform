'use server'
import { ContactForm, SlackMessage } from '@/types/models'

import { sendSlackMessage } from './server-utils'

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
