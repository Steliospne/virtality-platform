import { describe, expect, it, vi, beforeEach } from 'vitest'

const getSession = vi.fn()
const signOut = vi.fn()
const findFirst = vi.fn()

vi.mock('@virtality/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSession(...args), signOut: (...args: unknown[]) => signOut(...args) } },
  asAuthSession: (data: unknown) => data,
}))

vi.mock('@virtality/db', () => ({
  prisma: { subscription: { findFirst: (...args: unknown[]) => findFirst(...args) } },
}))

const { evaluateSessionGate } = await import('./session-gate')

describe('evaluateSessionGate', () => {
  beforeEach(() => {
    getSession.mockReset()
    signOut.mockReset()
    findFirst.mockReset()
  })

  it('sends unauthenticated requests to sign-in', async () => {
    getSession.mockResolvedValue(null)

    await expect(evaluateSessionGate(new Headers())).resolves.toBe('sign-in')
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('lets admins through without a Stripe lookup', async () => {
    getSession.mockResolvedValue({
      user: { role: 'admin', stripeCustomerId: null },
    })

    await expect(evaluateSessionGate(new Headers())).resolves.toBe('ok')
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('signs out and waitlists a clinician with no established billing path', async () => {
    getSession.mockResolvedValue({
      user: { role: 'user', stripeCustomerId: null },
    })

    await expect(evaluateSessionGate(new Headers())).resolves.toBe(
      'waitlist',
    )
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('keeps a clinician in console once a Subscription row is synced', async () => {
    getSession.mockResolvedValue({
      user: { role: 'user', stripeCustomerId: 'cus_123' },
    })
    findFirst.mockResolvedValue({ status: 'canceled' })

    await expect(evaluateSessionGate(new Headers())).resolves.toBe('ok')
    expect(signOut).not.toHaveBeenCalled()
  })

  it('treats a session-lookup failure as pass-through, not a hard block', async () => {
    getSession.mockRejectedValue(new Error('network error'))

    await expect(evaluateSessionGate(new Headers())).resolves.toBe('ok')
  })
})
