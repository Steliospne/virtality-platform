import { describe, expect, it } from 'vitest'
import { formatTrialGrantStatusSummary } from './trial-grant-display.ts'

describe('formatTrialGrantStatusSummary', () => {
  it('describes revoked grants without a clock', () => {
    expect(
      formatTrialGrantStatusSummary({
        id: 'grant_1',
        status: 'revoked',
        trialStart: new Date('2026-08-01T12:00:00.000Z'),
        trialEnd: new Date('2026-08-05T12:00:00.000Z'),
        createdAt: new Date('2026-08-01T12:00:00.000Z'),
        remainingMs: 0,
        entitled: false,
      }),
    ).toBe('Revoked · ended 5 Aug 2026, 12:00 UTC')
  })

  it('describes active grants with remaining time', () => {
    expect(
      formatTrialGrantStatusSummary({
        id: 'grant_1',
        status: 'active',
        trialStart: new Date('2026-08-10T12:00:00.000Z'),
        trialEnd: new Date('2026-08-17T12:00:00.000Z'),
        createdAt: new Date('2026-08-01T12:00:00.000Z'),
        remainingMs: 7 * 24 * 60 * 60 * 1000,
        entitled: true,
      }),
    ).toBe('Active · 7d remaining (ends 17 Aug 2026, 12:00 UTC)')
  })
})
