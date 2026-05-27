import { describe, expect, it } from 'vitest'
import { insertBilateralSiblingRow } from './program-list-bilateral-insert'
import type { CompleteExercise } from '@/types/models'

function row(direction: string, id = 'r1'): CompleteExercise {
  return {
    id,
    exerciseId: id,
    reps: 10,
    sets: 3,
    restTime: 5,
    holdTime: 1,
    speed: 1,
    romMode: 0,
    exercise: { displayName: 'Press', direction } as CompleteExercise['exercise'],
  }
}

describe('insertBilateralSiblingRow', () => {
  it('inserts Right immediately after an existing Left row', () => {
    const left = row('Left', 'a')
    const right = row('Right', 'b')
    const out = insertBilateralSiblingRow([left], 0, 'Right', right)
    expect(out.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('inserts Left immediately before an existing Right row', () => {
    const right = row('Right', 'b')
    const left = row('Left', 'a')
    const out = insertBilateralSiblingRow([right], 0, 'Left', left)
    expect(out.map((r) => r.id)).toEqual(['a', 'b'])
  })
})
