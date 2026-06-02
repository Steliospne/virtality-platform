import { describe, expect, it } from 'vitest'
import {
  enabledVariantsForSubmit,
  hasEnabledVariantsForSubmit,
  programExercisesForEditSubmit,
} from './program-submit-enabled-variants'
const variants = [
  { id: 'left', exerciseId: 'squat-left' },
  { id: 'right', exerciseId: 'squat-right' },
  { id: 'solo', exerciseId: 'march' },
]

describe('program submit enabled variants', () => {
  it('drops deferred-removal variants only for submit payload', () => {
    expect(enabledVariantsForSubmit(variants, ['left', 'solo'])).toEqual([
      { id: 'right', exerciseId: 'squat-right' },
    ])
  })

  it('returns all variants when nothing is deferred', () => {
    expect(enabledVariantsForSubmit(variants, [])).toEqual(variants)
  })

  it('reports no enabled variants when every row is deferred', () => {
    expect(
      hasEnabledVariantsForSubmit(variants, ['left', 'right', 'solo']),
    ).toBe(false)
    expect(
      enabledVariantsForSubmit(variants, ['left', 'right', 'solo']),
    ).toEqual([])
  })

  it('builds program-edit payload with programId on enabled variants only', () => {
    expect(programExercisesForEditSubmit(variants, ['left'], 'prog-1')).toEqual(
      [
        { id: 'right', exerciseId: 'squat-right', programId: 'prog-1' },
        { id: 'solo', exerciseId: 'march', programId: 'prog-1' },
      ],
    )
  })
})
