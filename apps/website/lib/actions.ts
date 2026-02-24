'use server'
import { ContactForm, SlackMessage, WaitlistFormType } from '@/types/models'
import { WaitlistFormSchema } from './definitions'
import { prisma } from '@virtality/db'
import { v4 as uuid } from 'uuid'
import resend from '@/resend'
import WaitingListEmail from '@/components/email/waitinglist-email'
import { createZoomMeeting, sendSlackMessage } from './server-utils'

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

export const submitBooking = async (formData: FormData) => {
  const entries = Object.fromEntries(formData)

  const slackWebhookUrl = process.env.SLACK_APPOINTMENT_WEBHOOK_URL

  if (!slackWebhookUrl) {
    console.error(
      'SLACK_APPOINTMENT_WEBHOOK_URL environment variable is not set',
    )
    throw new Error('Slack webhook URL is not configured')
  }

  const { name, email, date, time, notes } = entries as {
    name: string
    email: string
    date: string
    time: string
    notes: string
  }

  const splitDate = new Date(date).toISOString().split('T')[0]
  const safeSplitDate = splitDate ? splitDate.split('-') : null

  if (!safeSplitDate) throw new Error('Invalid date')

  const correctedDate = [
    safeSplitDate[0],
    safeSplitDate[1],
    String(Number(safeSplitDate[2]) + 1).padStart(2, '0'),
  ].join('-')
  console.log(correctedDate)
  // Format the date and time for display
  const appointmentDate = new Date(`${correctedDate}T${time}:00`)

  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Create Google Calendar link
  const startDateTime =
    appointmentDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const endDateTime =
    new Date(appointmentDate.getTime() + 30 * 60 * 1000)
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0] + 'Z'

  const meetingTopic = `Appointment with ${name}`
  const zoomStartTime = appointmentDate.toISOString()
  const zoomLink = await createZoomMeeting(meetingTopic, zoomStartTime)

  // 2. Update Google Calendar link to include Zoom URL
  const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Appointment%20with%20${encodeURIComponent(name)}&dates=${startDateTime}/${endDateTime}&details=Appointment%20booked%20via%20website%0A%0AClient:%20${encodeURIComponent(name)}%0AEmail:%20${encodeURIComponent(email)}${notes ? `%0ANotes:%20${encodeURIComponent(notes)}` : ''}%0AZoom%20Meeting:%20${encodeURIComponent(zoomLink)}&location=${encodeURIComponent(zoomLink)}`

  // Prepare Slack message
  const slackMessage: SlackMessage = {
    text: 'New Appointment Booking',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🗓️ New Appointment Booking',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Date:*\n${formattedDate}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${formattedTime}`,
          },
          {
            type: 'mrkdwn',
            text: `*Actions:*\n<${calendarLink}|📅 Add to Google Calendar>`,
          },
          {
            type: 'mrkdwn',
            text: `*Zoom Meeting:*\n<${zoomLink}|Join Zoom Meeting>`,
          },
        ],
      },
    ],
  }

  // Add notes section if provided
  if (notes) {
    slackMessage.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Notes:*\n${notes}`,
      },
    })
  }

  await sendSlackMessage(slackWebhookUrl, slackMessage, 'appointment')
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
