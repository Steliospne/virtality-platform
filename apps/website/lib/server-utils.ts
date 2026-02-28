'use server'

import { SlackMessage } from '@/types/models'

export const sendSlackMessage = async (
  webhook: string,
  message: SlackMessage,
  template: 'appointment' | 'contact',
) => {
  const errorMsg = `Failed to send Slack message for ${template} template`
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Error sending to Slack:', error)
    throw new Error(errorMsg)
  }
}
