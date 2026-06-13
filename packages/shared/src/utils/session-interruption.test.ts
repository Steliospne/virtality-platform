import { describe, expect, it } from 'vitest'
import {
  assertSessionCanBeInterrupted,
  isClinicalHistorySession,
  isCompletedClinicalSession,
  isInterruptedClinicalSession,
} from './session-interruption.ts'

describe('session interruption helpers', () => {
  it('allows interrupting only active sessions', () => {
    expect(() => assertSessionCanBeInterrupted('ACTIVE')).not.toThrow()
    expect(() => assertSessionCanBeInterrupted('COMPLETED')).toThrow(
      /only active sessions/i,
    )
    expect(() => assertSessionCanBeInterrupted('INTERRUPTED')).toThrow(
      /only active sessions/i,
    )
  })

  it('classifies clinical history sessions', () => {
    expect(isCompletedClinicalSession('COMPLETED')).toBe(true)
    expect(isInterruptedClinicalSession('INTERRUPTED')).toBe(true)
    expect(isClinicalHistorySession('COMPLETED')).toBe(true)
    expect(isClinicalHistorySession('INTERRUPTED')).toBe(true)
    expect(isClinicalHistorySession('ACTIVE')).toBe(false)
  })
})
