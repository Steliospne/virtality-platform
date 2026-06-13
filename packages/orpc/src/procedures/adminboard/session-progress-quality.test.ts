import { describe, expect, it } from 'vitest'
import {
  getExerciseProgressQualityPercent,
  getProgressQualityDeltaPercent,
  getSessionProgressQualityPercent,
  parseSessionProgressValue,
} from './session-progress-quality.ts'

describe('parseSessionProgressValue', () => {
  it('returns an empty array for malformed JSON', () => {
    expect(parseSessionProgressValue('not-json')).toEqual([])
    expect(parseSessionProgressValue('{"rep":1}')).toEqual([])
  })
})

describe('getExerciseProgressQualityPercent', () => {
  it('averages rep progress across sets in one exercise payload', () => {
    const value = JSON.stringify([
      { rep: 1, set_1: 80, set_2: 60 },
      { rep: 2, set_1: 90, set_2: 70 },
    ])

    expect(getExerciseProgressQualityPercent(value)).toBe(75)
  })

  it('returns null when progress payload is empty or unusable', () => {
    expect(getExerciseProgressQualityPercent('[]')).toBeNull()
    expect(getExerciseProgressQualityPercent('not-json')).toBeNull()
  })
})

describe('getSessionProgressQualityPercent', () => {
  it('averages quality across exercises with valid progress', () => {
    const quality = getSessionProgressQualityPercent([
      { value: JSON.stringify([{ rep: 1, set_1: 80 }]) },
      { value: JSON.stringify([{ rep: 1, set_1: 60 }]) },
    ])

    expect(quality).toBe(70)
  })

  it('ignores exercises with missing or malformed progress', () => {
    const quality = getSessionProgressQualityPercent([
      { value: 'not-json' },
      { value: JSON.stringify([{ rep: 1, set_1: 50 }]) },
    ])

    expect(quality).toBe(50)
  })

  it('returns null when no exercise has usable progress', () => {
    expect(
      getSessionProgressQualityPercent([
        { value: 'not-json' },
        { value: '[]' },
      ]),
    ).toBeNull()
  })
})

describe('getProgressQualityDeltaPercent', () => {
  it('returns the difference between first and latest session quality', () => {
    const delta = getProgressQualityDeltaPercent([
      { completedAt: '2026-06-10T10:00:00.000Z', qualityPercent: 55 },
      { completedAt: '2026-06-12T10:00:00.000Z', qualityPercent: 70 },
      { completedAt: '2026-06-15T10:00:00.000Z', qualityPercent: 65 },
    ])

    expect(delta).toBe(10)
  })

  it('returns null when fewer than two sessions have quality', () => {
    expect(
      getProgressQualityDeltaPercent([
        { completedAt: '2026-06-10T10:00:00.000Z', qualityPercent: 55 },
      ]),
    ).toBeNull()
    expect(getProgressQualityDeltaPercent([])).toBeNull()
  })
})
