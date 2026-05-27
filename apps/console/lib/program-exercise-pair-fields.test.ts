import { describe, expect, it } from 'vitest'
import {
  copyProgramExerciseFields,
  programExerciseFieldsDiverge,
} from './program-exercise-pair-fields.ts'
import type { CompleteExercise } from '@/types/models'

function base(partial: Partial<CompleteExercise> = {}): CompleteExercise {
  return {
    id: 'a',
    exerciseId: 'ex',
    reps: 10,
    sets: 3,
    restTime: 5,
    holdTime: 1,
    speed: 1,
    romMode: 0,
    ...partial,
  }
}

describe('programExerciseFieldsDiverge', () => {
  it('returns false when all comparable fields match', () => {
    expect(programExerciseFieldsDiverge(base(), base({ id: 'b' }))).toBe(false)
  })

  it('returns true when reps differ', () => {
    expect(programExerciseFieldsDiverge(base(), base({ reps: 99 }))).toBe(true)
  })
})

describe('copyProgramExerciseFields', () => {
  it('copies program fields from source onto target', () => {
    const target = base({ id: 't', reps: 1 })
    const source = base({ id: 's', reps: 88, sets: 9 })
    const out = copyProgramExerciseFields(target, source)
    expect(out.reps).toBe(88)
    expect(out.sets).toBe(9)
    expect(out.id).toBe('t')
  })
})
