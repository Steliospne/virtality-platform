'use server'
import { ContactForm, SlackMessage } from '@/types/models'

import { sendSlackMessage } from './server-utils'
import { serverLogger } from './server-logger'

const logger = serverLogger.child({
  component: 'website-actions',
})

export const submitContactMsg = async (
  state: ContactForm,
  formData: FormData,
) => {
  if (!formData) return state

  const slackWebhookUrl = process.env.SLACK_MESSAGE_WEBHOOK_URL

  if (!slackWebhookUrl) {
    logger.error(
      'website.contact_submit.webhook_missing',
      {
        action: 'submitContactMsg',
      },
      'Slack webhook is not configured',
    )
    throw new Error('Slack webhook URL is not configured')
  }

  const entries = Object.fromEntries(formData) as ContactForm
  const { firstName, lastName, email, phone, message } = entries

  logger.info('website.contact_submit.requested', {
    hasPhone: Boolean(phone),
    messageLength: message.length,
  })

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
