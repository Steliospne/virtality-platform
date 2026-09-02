import type { AppLogger } from '../../observability/index.ts'

export type SlackMessage = {
  text: string
  blocks: (
    | {
        type: string
        text: {
          type: string
          text: string
        }
        fields?: undefined
      }
    | {
        type: string
        fields: {
          type: string
          text: string
        }[]
        text?: undefined
      }
  )[]
}

export type SendSlackMessageOptions = {
  fetchImpl?: typeof fetch
  logger?: AppLogger
  failureEvent?: string
}

export const sendSlackMessage = async (
  webhook: string,
  message: SlackMessage,
  template: string,
  options: SendSlackMessageOptions = {},
) => {
  const errorMsg = `Failed to send Slack message for ${template} template`
  const fetchImpl = options.fetchImpl ?? fetch
  const failureEvent = options.failureEvent ?? 'slack_send.failed'

  try {
    const response = await fetchImpl(webhook, {
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
    options.logger?.error(
      failureEvent,
      {
        template,
        error,
      },
      'Failed to send Slack message',
    )
    throw new Error(errorMsg)
  }
}
