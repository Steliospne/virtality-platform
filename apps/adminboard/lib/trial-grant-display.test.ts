import { describe, expect, it } from 'vitest'
import { formatTrialGrantStatusSummary } from './trial-grant-display.ts'

describe('formatTrialGrantStatusSummary', () => {
  it('describes pending grants without a clock', () => {
    expect(
      formatTrialGrantStatusSummary({
        id: 'grant_1',
        code: 'PILOT-42',
        status: 'pending',
        trialStart: null,
        trialEnd: null,
        createdAt: new Date('2026-08-01T12:00:00.000Z'),
        remainingMs: 0,
        entitled: false,
      }),
    ).toBe('Pending onboarding · code PILOT-42')
  })

  it('describes active grants with remaining time', () => {
    expect(
      formatTrialGrantStatusSummary({
        id: 'grant_1',
        code: 'PILOT-42',
        status: 'active',
        trialStart: new Date('2026-08-10T12:00:00.000Z'),
        trialEnd: new Date('2026-08-17T12:00:00.000Z'),
        createdAt: new Date('2026-08-01T12:00:00.000Z'),
        remainingMs: 7 * 24 * 60 * 60 * 1000,
        entitled: true,
      }),
    ).toBe(
      'Active · 7d remaining (ends 17 Aug 2026, 12:00 UTC) · code PILOT-42',
    )
  })
})
