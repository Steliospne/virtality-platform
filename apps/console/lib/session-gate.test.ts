import { describe, expect, it, vi, beforeEach } from 'vitest'

const getSession = vi.fn()
const signOut = vi.fn()
const findFirst = vi.fn()

vi.mock('@/auth-client', () => ({
  authClient: {
    getSession: (...args: unknown[]) => getSession(...args),
    signOut: (...args: unknown[]) => signOut(...args),
  },
}))

vi.mock('@virtality/db', () => ({
  prisma: { subscription: { findFirst: (...args: unknown[]) => findFirst(...args) } },
}))

const { evaluateSessionGate } = await import('./session-gate')

function fakeSetCookieResponse(cookies: string[]) {
  return {
    headers: { getSetCookie: () => cookies },
  } as unknown as Response
}

describe('evaluateSessionGate', () => {
  beforeEach(() => {
    getSession.mockReset()
    signOut.mockReset()
    findFirst.mockReset()
  })

  it('sends unauthenticated requests to sign-in', async () => {
    getSession.mockResolvedValue({ data: null })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'sign-in',
      setCookies: [],
    })
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('lets admins through without a Stripe lookup', async () => {
    getSession.mockResolvedValue({
      data: { user: { role: 'admin', stripeCustomerId: null } },
    })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'ok',
      setCookies: [],
    })
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('signs out over HTTP and relays the Set-Cookie for a clinician with no established billing path', async () => {
    getSession.mockResolvedValue({
      data: { user: { role: 'user', stripeCustomerId: null } },
    })
    signOut.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions.onResponse(
        {
          response: fakeSetCookieResponse([
            'better-auth.session_token=; Max-Age=0',
          ]),
        },
      )
      return { data: null }
    })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'waitlist',
      setCookies: ['better-auth.session_token=; Max-Age=0'],
    })
  })

  it('keeps a clinician in console once a Subscription row is synced', async () => {
    getSession.mockResolvedValue({
      data: { user: { role: 'user', stripeCustomerId: 'cus_123' } },
    })
    findFirst.mockResolvedValue({ status: 'canceled' })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'ok',
      setCookies: [],
    })
    expect(signOut).not.toHaveBeenCalled()
  })

  it('treats a session-lookup failure as pass-through, not a hard block', async () => {
    getSession.mockRejectedValue(new Error('network error'))

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'ok',
      setCookies: [],
    })
  })
})
