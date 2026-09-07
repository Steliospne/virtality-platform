import { describe, expect, it } from 'vitest'
import { shouldShowTrialWelcome, TRIAL_WELCOME_PATH } from './trial-welcome.ts'

const NOW = new Date('2026-09-07T08:00:00.000Z')
const FUTURE = new Date('2026-09-21T08:00:00.000Z')
const PAST = new Date('2026-08-01T08:00:00.000Z')

const liveTrial = {
  status: 'trialing' as const,
  trialStart: NOW,
  trialEnd: FUTURE,
}

describe('shouldShowTrialWelcome', () => {
  it('is true for a live timed Access Gate that has not been seen', () => {
    expect(
      shouldShowTrialWelcome({
        role: 'user',
        accessGate: liveTrial,
        hasSeenWelcome: false,
        now: NOW,
      }),
    ).toBe(true)
  })

  it('is false once the welcome has been seen', () => {
    expect(
      shouldShowTrialWelcome({
        role: 'user',
        accessGate: liveTrial,
        hasSeenWelcome: true,
        now: NOW,
      }),
    ).toBe(false)
  })

  it('is false when hasSeenWelcome is omitted', () => {
    expect(
      shouldShowTrialWelcome({
        role: 'user',
        accessGate: liveTrial,
        now: NOW,
      }),
    ).toBe(false)
  })

  it('skips admin and tester roles', () => {
    expect(
      shouldShowTrialWelcome({
        role: 'admin',
        accessGate: liveTrial,
        hasSeenWelcome: false,
        now: NOW,
      }),
    ).toBe(false)
    expect(
      shouldShowTrialWelcome({
        role: 'tester',
        accessGate: liveTrial,
        hasSeenWelcome: false,
        now: NOW,
      }),
    ).toBe(false)
  })

  it('skips permanent grants and expired trials', () => {
    expect(
      shouldShowTrialWelcome({
        role: 'user',
        accessGate: {
          status: 'granted',
          trialStart: NOW,
          trialEnd: null,
        },
        hasSeenWelcome: false,
        now: NOW,
      }),
    ).toBe(false)
    expect(
      shouldShowTrialWelcome({
        role: 'user',
        accessGate: {
          status: 'trialing',
          trialStart: PAST,
          trialEnd: PAST,
        },
        hasSeenWelcome: false,
        now: NOW,
      }),
    ).toBe(false)
  })

  it('exports the Console path', () => {
    expect(TRIAL_WELCOME_PATH).toBe('/welcome/trial')
  })
})
