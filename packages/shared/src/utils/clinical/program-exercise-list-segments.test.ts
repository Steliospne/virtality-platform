import { describe, expect, it } from 'vitest'
import { segmentProgramExerciseRowsByAdjacentBilateralFamilies } from './program-exercise-list-segments.ts'

function row(displayName: string, direction: string) {
  return { displayName, direction }
}

describe('segmentProgramExerciseRowsByAdjacentBilateralFamilies', () => {
  it('merges adjacent left/right with same displayName into one bilateral segment', () => {
    const r = segmentProgramExerciseRowsByAdjacentBilateralFamilies([
      row('Press', 'Left'),
      row('Press', 'Right'),
    ])
    expect(r).toEqual([{ kind: 'bilateral', startIndex: 0 }])
  })

  it('does not merge when directions are not a near-term left/right pair', () => {
    const r = segmentProgramExerciseRowsByAdjacentBilateralFamilies([
      row('Press', 'Left'),
      row('Press', 'Left'),
    ])
    expect(r).toEqual([
      { kind: 'single', startIndex: 0 },
      { kind: 'single', startIndex: 1 },
    ])
  })

  it('does not merge across different display names', () => {
    const r = segmentProgramExerciseRowsByAdjacentBilateralFamilies([
      row('Press', 'Left'),
      row('Curl', 'Right'),
    ])
    expect(r).toEqual([
      { kind: 'single', startIndex: 0 },
      { kind: 'single', startIndex: 1 },
    ])
  })

  it('does not merge non-adjacent bilateral variants', () => {
    const r = segmentProgramExerciseRowsByAdjacentBilateralFamilies([
      row('Press', 'Left'),
      row('Curl', 'Left'),
      row('Press', 'Right'),
    ])
    expect(r).toEqual([
      { kind: 'single', startIndex: 0 },
      { kind: 'single', startIndex: 1 },
      { kind: 'single', startIndex: 2 },
    ])
  })

  it('handles alternating singles and bilateral groups', () => {
    const r = segmentProgramExerciseRowsByAdjacentBilateralFamilies([
      row('A', 'Left'),
      row('A', 'Right'),
      row('B', 'Left'),
      row('C', 'Right'),
    ])
    expect(r).toEqual([
      { kind: 'bilateral', startIndex: 0 },
      { kind: 'single', startIndex: 2 },
      { kind: 'single', startIndex: 3 },
    ])
  })
})
