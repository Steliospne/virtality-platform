import { describe, expect, it, vi, beforeEach } from 'vitest'

const getSession = vi.fn()
const signOut = vi.fn()
const findMany = vi.fn()
const findAccessGrantFirst = vi.fn()

vi.mock('@/auth-client', () => ({
  authClient: {
    getSession: (...args: unknown[]) => getSession(...args),
    signOut: (...args: unknown[]) => signOut(...args),
  },
}))

vi.mock('@virtality/db', () => ({
  prisma: {
    subscription: { findMany: (...args: unknown[]) => findMany(...args) },
    accessGrant: {
      findFirst: (...args: unknown[]) => findAccessGrantFirst(...args),
    },
  },
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
    findMany.mockReset()
    findMany.mockResolvedValue([])
    findAccessGrantFirst.mockReset()
    findAccessGrantFirst.mockResolvedValue(null)
  })

  it('sends unauthenticated requests to sign-in', async () => {
    getSession.mockResolvedValue({ data: null })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'sign-in',
      setCookies: [],
    })
    expect(findMany).not.toHaveBeenCalled()
  })

  it('lets admins through without a Stripe lookup', async () => {
    getSession.mockResolvedValue({
      data: { user: { role: 'admin', stripeCustomerId: null } },
    })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'ok',
      setCookies: [],
    })
    expect(findMany).not.toHaveBeenCalled()
  })

  it('signs out over HTTP and relays the Set-Cookie for a clinician with no established billing path', async () => {
    getSession.mockResolvedValue({
      data: { user: { id: 'user_1', role: 'user', stripeCustomerId: null } },
    })
    signOut.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions.onResponse({
        response: fakeSetCookieResponse([
          'better-auth.session_token=; Max-Age=0',
        ]),
      })
      return { data: null }
    })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'waitlist',
      setCookies: ['better-auth.session_token=; Max-Age=0'],
    })
  })

  it('keeps a clinician in console once an Access Gate has been issued', async () => {
    getSession.mockResolvedValue({
      data: { user: { id: 'user_1', role: 'user', stripeCustomerId: null } },
    })
    findAccessGrantFirst.mockResolvedValue({ id: 'grant_1' })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'ok',
      setCookies: [],
      user: { id: 'user_1', role: 'user' },
    })
    expect(signOut).not.toHaveBeenCalled()
  })

  it('keeps a clinician in console once a Subscription row is synced', async () => {
    getSession.mockResolvedValue({
      data: {
        user: { id: 'user_1', role: 'user', stripeCustomerId: 'cus_123' },
      },
    })
    findMany.mockResolvedValue([{ status: 'canceled' }])

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'ok',
      setCookies: [],
      user: { id: 'user_1', role: 'user' },
    })
    expect(signOut).not.toHaveBeenCalled()
  })

  it('still waitlists when the only Subscription row is an abandoned Checkout placeholder', async () => {
    getSession.mockResolvedValue({
      data: {
        user: { id: 'user_1', role: 'user', stripeCustomerId: 'cus_123' },
      },
    })
    findMany.mockResolvedValue([{ status: 'incomplete' }])
    signOut.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions.onResponse({
        response: fakeSetCookieResponse(['session=; Max-Age=0']),
      })
      return { data: null }
    })

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'waitlist',
      setCookies: ['session=; Max-Age=0'],
    })
  })

  it('treats a session-lookup failure as pass-through, not a hard block', async () => {
    getSession.mockRejectedValue(new Error('network error'))

    await expect(evaluateSessionGate(new Headers())).resolves.toEqual({
      decision: 'ok',
      setCookies: [],
    })
  })
})
