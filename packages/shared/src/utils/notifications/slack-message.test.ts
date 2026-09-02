import { describe, expect, it, vi } from 'vitest'
import { sendSlackMessage, type SlackMessage } from './slack-message.ts'

const message: SlackMessage = {
  text: 'Hello',
  blocks: [],
}

describe('sendSlackMessage', () => {
  it('delivers the message to the Slack webhook', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })

    await sendSlackMessage('https://hooks.slack.com/test', message, 'contact', {
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith('https://hooks.slack.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  })

  it('throws when Slack returns a non-OK response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    await expect(
      sendSlackMessage('https://hooks.slack.com/test', message, 'contact', {
        fetchImpl,
      }),
    ).rejects.toThrow('Failed to send Slack message for contact template')
  })

  it('logs a failure event when delivery fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))
    const logger = {
      error: vi.fn(),
    }

    await expect(
      sendSlackMessage('https://hooks.slack.com/test', message, 'contact', {
        fetchImpl,
        logger,
        failureEvent: 'website.slack_send.failed',
      }),
    ).rejects.toThrow('Failed to send Slack message for contact template')

    expect(logger.error).toHaveBeenCalledWith(
      'website.slack_send.failed',
      expect.objectContaining({
        template: 'contact',
        error: expect.any(Error),
      }),
      'Failed to send Slack message',
    )
  })
})
