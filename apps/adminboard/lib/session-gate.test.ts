import { describe, expect, it, vi, beforeEach } from 'vitest'

const getSession = vi.fn()

vi.mock('@/auth-client', () => ({
  authClient: {
    getSession: (...args: unknown[]) => getSession(...args),
  },
}))

const { evaluateSessionGate } = await import('./session-gate')

describe('evaluateSessionGate', () => {
  beforeEach(() => {
    getSession.mockReset()
  })

  it('sends unauthenticated requests to sign-in', async () => {
    getSession.mockResolvedValue({ data: null })

    await expect(evaluateSessionGate(new Headers())).resolves.toBe('sign-in')
  })

  it('blocks a signed-in non-admin from adminboard', async () => {
    getSession.mockResolvedValue({ data: { user: { role: 'user' } } })

    await expect(evaluateSessionGate(new Headers())).resolves.toBe('no-access')
  })

  it('lets an admin through', async () => {
    getSession.mockResolvedValue({ data: { user: { role: 'admin' } } })

    await expect(evaluateSessionGate(new Headers())).resolves.toBe('ok')
  })
})
