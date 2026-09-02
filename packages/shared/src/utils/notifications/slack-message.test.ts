import { describe, expect, it, vi } from 'vitest'
import { sendSlackMessage, type SlackMessage } from './slack-message.ts'

const message: SlackMessage = {
  text: 'Hello',
  blocks: [],
}

describe('sendSlackMessage', () => {
  it('posts the message payload to the webhook', async () => {
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
})
