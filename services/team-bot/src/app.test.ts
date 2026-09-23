import { createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app.ts'

const APP_SECRET = 'app-secret'

function sign(body: string, secret = APP_SECRET) {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
}

function textMessagePayload(id: string) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'waba-id',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550000000',
                phone_number_id: 'phone-id',
              },
              contacts: [{ wa_id: '306900000000', profile: { name: 'Eleni' } }],
              messages: [
                {
                  id,
                  from: '306900000000',
                  timestamp: '1758600000',
                  type: 'text',
                  text: { body: 'Fix login\nIt spins forever' },
                },
              ],
            },
          },
        ],
      },
    ],
  }
}

function createTestApp() {
  const onMessage = vi.fn().mockResolvedValue(undefined)
  const background: Promise<void>[] = []
  const app = createApp({
    verifyToken: 'verify-me',
    appSecret: APP_SECRET,
    onMessage,
    runInBackground: (task) => background.push(task),
    logger: { warn: vi.fn(), error: vi.fn() },
  })
  return { app, onMessage, background }
}

describe('GET /webhook', () => {
  it('echoes the challenge when the verify token matches', async () => {
    const { app } = createTestApp()
    const res = await app.request(
      '/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=12345',
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('12345')
  })

  it('rejects a wrong verify token', async () => {
    const { app } = createTestApp()
    const res = await app.request(
      '/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=12345',
    )
    expect(res.status).toBe(403)
  })
})

describe('POST /webhook', () => {
  it('hands each signed message to onMessage', async () => {
    const { app, onMessage, background } = createTestApp()
    const body = JSON.stringify(textMessagePayload('wamid.1'))

    const res = await app.request('/webhook', {
      method: 'POST',
      headers: { 'x-hub-signature-256': sign(body) },
      body,
    })

    expect(res.status).toBe(200)
    expect(background).toHaveLength(1)
    expect(onMessage).toHaveBeenCalledWith({
      id: 'wamid.1',
      from: '306900000000',
      senderName: 'Eleni',
      phoneNumberId: 'phone-id',
      type: 'text',
      text: 'Fix login\nIt spins forever',
    })
  })

  it('rejects a body signed with another secret', async () => {
    const { app, onMessage } = createTestApp()
    const body = JSON.stringify(textMessagePayload('wamid.1'))

    const res = await app.request('/webhook', {
      method: 'POST',
      headers: { 'x-hub-signature-256': sign(body, 'other-secret') },
      body,
    })

    expect(res.status).toBe(401)
    expect(onMessage).not.toHaveBeenCalled()
  })

  it('rejects an unsigned request', async () => {
    const { app } = createTestApp()
    const res = await app.request('/webhook', { method: 'POST', body: '{}' })
    expect(res.status).toBe(401)
  })

  it('acknowledges status-only deliveries without handling anything', async () => {
    const { app, onMessage } = createTestApp()
    const body = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                metadata: { phone_number_id: 'phone-id' },
                statuses: [{ id: 'wamid.2', status: 'delivered' }],
              },
            },
          ],
        },
      ],
    })

    const res = await app.request('/webhook', {
      method: 'POST',
      headers: { 'x-hub-signature-256': sign(body) },
      body,
    })

    expect(res.status).toBe(200)
    expect(onMessage).not.toHaveBeenCalled()
  })
})
