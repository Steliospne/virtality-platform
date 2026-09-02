import type { AppLogger } from '../../observability/index.ts'

type SlackTextObject = {
  type: string
  text: string
}

type SlackBlock =
  | {
      type: string
      text: SlackTextObject
      fields?: undefined
    }
  | {
      type: string
      fields: SlackTextObject[]
      text?: undefined
    }

export type SlackMessage = {
  text: string
  blocks: SlackBlock[]
}

export type SlackMessageTemplate =
  | 'appointment'
  | 'contact'
  | 'subscription-reconciliation'

export type SendSlackMessageOptions = {
  fetchImpl?: typeof fetch
  logger?: AppLogger
  failureEvent?: string
}

export const sendSlackMessage = async (
  webhook: string,
  message: SlackMessage,
  template: SlackMessageTemplate,
  {
    fetchImpl = fetch,
    logger,
    failureEvent = 'slack_send.failed',
  }: SendSlackMessageOptions = {},
): Promise<void> => {
  const errorMessage = `Failed to send Slack message for ${template} template`

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
    logger?.error(
      failureEvent,
      {
        template,
        error,
      },
      'Failed to send Slack message',
    )
    throw new Error(errorMessage)
  }
}
