import { describe, expect, it } from 'vitest'
import {
  formatPendingHoldCountdown,
  pendingHoldRemainingMs,
} from './pending-hold-countdown.ts'

describe('formatPendingHoldCountdown', () => {
  it('formats full two minutes', () => {
    expect(formatPendingHoldCountdown(120_000)).toBe('2:00')
  })

  it('formats under one minute', () => {
    expect(formatPendingHoldCountdown(45_000)).toBe('0:45')
  })

  it('floors at zero', () => {
    expect(formatPendingHoldCountdown(-1_000)).toBe('0:00')
  })
})

describe('pendingHoldRemainingMs', () => {
  it('returns remaining ms until expiresAt', () => {
    const now = Date.parse('2026-08-29T10:00:00.000Z')
    expect(pendingHoldRemainingMs('2026-08-29T10:01:30.000Z', now)).toBe(90_000)
  })
})
