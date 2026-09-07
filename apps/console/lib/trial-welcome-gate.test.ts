import { describe, expect, it, vi, beforeEach } from 'vitest'

const findAccessGrantFirst = vi.fn()

vi.mock('@virtality/db', () => ({
  prisma: {
    accessGrant: {
      findFirst: (...args: unknown[]) => findAccessGrantFirst(...args),
    },
  },
}))

const { clinicianNeedsTrialWelcome, isTrialWelcomePath } =
  await import('./trial-welcome-gate')

const FUTURE = new Date('2026-09-21T08:00:00.000Z')
const NOW = new Date('2026-09-07T08:00:00.000Z')

describe('trial welcome gate', () => {
  beforeEach(() => {
    findAccessGrantFirst.mockReset()
  })

  it('does not query Stripe-or-grant state for staff roles', async () => {
    await expect(
      clinicianNeedsTrialWelcome({ userId: 'user_1', role: 'admin' }),
    ).resolves.toBe(false)
    await expect(
      clinicianNeedsTrialWelcome({ userId: 'user_1', role: 'tester' }),
    ).resolves.toBe(false)
    expect(findAccessGrantFirst).not.toHaveBeenCalled()
  })

  it('is true for a live unseen timed Access Gate', async () => {
    findAccessGrantFirst.mockResolvedValue({
      status: 'trialing',
      trialStart: NOW,
      trialEnd: FUTURE,
      hasSeenWelcome: false,
    })

    await expect(
      clinicianNeedsTrialWelcome({
        userId: 'user_1',
        role: 'user',
        now: NOW,
      }),
    ).resolves.toBe(true)
  })

  it('is false after the welcome has been seen', async () => {
    findAccessGrantFirst.mockResolvedValue({
      status: 'trialing',
      trialStart: NOW,
      trialEnd: FUTURE,
      hasSeenWelcome: true,
    })

    await expect(
      clinicianNeedsTrialWelcome({
        userId: 'user_1',
        role: 'user',
        now: NOW,
      }),
    ).resolves.toBe(false)
  })

  it('recognizes the welcome path', () => {
    expect(isTrialWelcomePath('/welcome/trial')).toBe(true)
    expect(isTrialWelcomePath('/welcome/trial/')).toBe(true)
    expect(isTrialWelcomePath('/patients')).toBe(false)
  })
})
