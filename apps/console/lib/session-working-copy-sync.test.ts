import { describe, expect, it } from 'vitest'
import type { CompleteExercise } from '@/types/models'
import {
  buildSessionWorkingCopySyncPayload,
  serializeSessionWorkingCopy,
  shouldPersistSessionWorkingCopy,
} from './session-working-copy-sync.ts'

const sampleExercises = [
  {
    id: 'row-1',
    exerciseId: 'exercise-1',
    sets: 3,
    reps: 10,
    restTime: 5,
    holdTime: 1,
    speed: 1,
    romMode: 0 as const,
  },
] satisfies CompleteExercise[]

describe('session working copy sync helpers', () => {
  it('persists only while a started session exists', () => {
    expect(
      shouldPersistSessionWorkingCopy('started', 'session-1', sampleExercises),
    ).toBe(true)
    expect(
      shouldPersistSessionWorkingCopy('paused', 'session-1', sampleExercises),
    ).toBe(true)
    expect(
      shouldPersistSessionWorkingCopy('ready', 'session-1', sampleExercises),
    ).toBe(false)
    expect(
      shouldPersistSessionWorkingCopy('started', undefined, sampleExercises),
    ).toBe(false)
    expect(shouldPersistSessionWorkingCopy('started', 'session-1', [])).toBe(
      false,
    )
  })

  it('builds sync payload from the live working copy while preserving row ids', () => {
    const payload = buildSessionWorkingCopySyncPayload({
      sessionId: 'session-1',
      exercises: [
        {
          ...sampleExercises[0]!,
          sets: 4,
          reps: 12,
          holdTime: 2,
          speed: 1.5,
        },
      ],
      persistedRows: [{ id: 'session-row-1', exerciseId: 'exercise-1' }],
      createId: () => 'unused-id',
    })

    expect(payload).toEqual({
      id: 'session-1',
      exercises: [
        {
          id: 'session-row-1',
          exerciseId: 'exercise-1',
          position: 0,
          sets: 4,
          reps: 12,
          restTime: 5,
          holdTime: 2,
          speed: 1.5,
        },
      ],
    })
  })

  it('serializes working copy settings for change detection', () => {
    expect(serializeSessionWorkingCopy(sampleExercises)).toBe(
      JSON.stringify([
        {
          exerciseId: 'exercise-1',
          sets: 3,
          reps: 10,
          restTime: 5,
          holdTime: 1,
          speed: 1,
        },
      ]),
    )
  })
})
