import { describe, expect, it, vi } from 'vitest'
import { deliverIndividualEmails } from './admin-email-delivery.js'

describe('deliverIndividualEmails', () => {
  it('sends one delivery attempt per recipient without exposing recipients to each other', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined)

    const results = await deliverIndividualEmails({
      recipients: ['one@example.com', 'two@example.com'],
      subject: 'June update',
      html: '<p>Hello</p>',
      sendEmail,
    })

    expect(sendEmail).toHaveBeenCalledTimes(2)
    expect(sendEmail).toHaveBeenNthCalledWith(1, {
      to: 'one@example.com',
      subject: 'June update',
      html: '<p>Hello</p>',
    })
    expect(sendEmail).toHaveBeenNthCalledWith(2, {
      to: 'two@example.com',
      subject: 'June update',
      html: '<p>Hello</p>',
    })
    expect(results).toEqual([
      expect.objectContaining({
        recipientEmail: 'one@example.com',
        status: 'sent',
      }),
      expect.objectContaining({
        recipientEmail: 'two@example.com',
        status: 'sent',
      }),
    ])
  })

  it('records partial failures without rolling back successful deliveries', async () => {
    const sendEmail = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('smtp rejected'))

    const results = await deliverIndividualEmails({
      recipients: ['ok@example.com', 'bad@example.com'],
      subject: 'June update',
      html: '<p>Hello</p>',
      sendEmail,
    })

    expect(results).toEqual([
      expect.objectContaining({
        recipientEmail: 'ok@example.com',
        status: 'sent',
      }),
      expect.objectContaining({
        recipientEmail: 'bad@example.com',
        status: 'failed',
        errorMessage: 'smtp rejected',
      }),
    ])
  })
})
