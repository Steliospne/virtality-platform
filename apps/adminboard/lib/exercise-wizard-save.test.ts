import { describe, expect, it } from 'vitest'
import { formatExerciseDraftOccupancyError } from './exercise-wizard-save'

describe('formatExerciseDraftOccupancyError', () => {
  it('formats single and multiple occupied Unity names', () => {
    expect(formatExerciseDraftOccupancyError(['Move_L'])).toBe(
      'Unity name Move_L is already in use.',
    )
    expect(formatExerciseDraftOccupancyError(['Move_L', 'Move_R'])).toBe(
      'Unity names Move_L, Move_R are already in use.',
    )
  })
})
