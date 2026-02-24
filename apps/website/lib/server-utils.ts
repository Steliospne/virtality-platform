'use server'

import { SlackMessage } from '@/types/models'

export const getZoomAccessToken = async () => {
  const { ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID } = process.env

  if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
    throw new Error('Missing Zoom credentials in environment variables')
  }

  const auth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString(
    'base64',
  )

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to get Zoom access token')
  }

  try {
    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error parsing Zoom access token response:', error)
    throw new Error('Failed to parse Zoom access token response')
  }
}

export const createZoomMeeting = async (topic: string, startTime: string) => {
  const accessToken = await getZoomAccessToken()

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime, // ISO 8601 format
      duration: 30,
      timezone: 'UTC',
      settings: {
        join_before_host: true,
        approval_type: 0,
        registration_type: 1,
        enforce_login: false,
        waiting_room: false,
      },
    }),
  })

  if (!response.ok) {
    console.error(await response.text())
    throw new Error('Failed to create Zoom meeting')
  }

  const data = await response.json()
  return data.join_url
}

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
