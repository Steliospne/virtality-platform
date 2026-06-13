import { describe, expect, it } from 'vitest'
import {
  getExerciseTherapyDose,
  getSessionDurationMinutes,
  getSessionTherapyDose,
} from './session-therapy-intensity.ts'

describe('session therapy intensity', () => {
  it('calculates dose from session exercise settings', () => {
    expect(
      getExerciseTherapyDose({
        sets: 3,
        reps: 10,
        holdTime: 5,
        speed: 1.5,
      }),
    ).toBe(225)

    expect(
      getSessionTherapyDose([
        { sets: 2, reps: 8, holdTime: 4, speed: 1 },
        { sets: 1, reps: 5, holdTime: 2, speed: 2 },
      ]),
    ).toBe(84)
  })

  it('returns null dose when a session has no exercise settings', () => {
    expect(getSessionTherapyDose([])).toBeNull()
  })

  it('calculates session duration in minutes', () => {
    expect(
      getSessionDurationMinutes(
        '2026-06-10T10:00:00.000Z',
        '2026-06-10T10:45:00.000Z',
      ),
    ).toBe(45)
  })

  it('returns null duration when timestamps are invalid', () => {
    expect(
      getSessionDurationMinutes(
        '2026-06-10T11:00:00.000Z',
        '2026-06-10T10:00:00.000Z',
      ),
    ).toBeNull()
  })
})
