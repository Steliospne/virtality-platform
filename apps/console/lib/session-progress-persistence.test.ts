import { describe, expect, it } from 'vitest'
import { buildSessionExerciseRowsFromWorkingCopy } from './patient-dashboard-session-launch.js'
import {
  buildCurrentExerciseProgressUpsert,
  buildSessionProgressUpserts,
  serializeSessionProgressValue,
} from './session-progress-persistence.js'
import type { CompleteExercise } from '@/types/models'

const sampleExercises: CompleteExercise[] = [
  {
    id: 'row-1',
    exerciseId: 'ex-1',
    sets: 3,
    reps: 10,
    restTime: 5,
    holdTime: 1,
    speed: 1,
    romMode: 0,
  },
  {
    id: 'row-2',
    exerciseId: 'ex-2',
    sets: 2,
    reps: 8,
    restTime: 4,
    holdTime: 2,
    speed: 1.5,
    romMode: 0,
  },
]

describe('serializeSessionProgressValue', () => {
  it('keeps progress as JSON text', () => {
    const value = serializeSessionProgressValue([
      { rep: 1, set_1: 80 },
      { rep: 2, set_1: 90 },
    ])

    expect(typeof value).toBe('string')
    expect(JSON.parse(value)).toEqual([
      { rep: 1, set_1: 80 },
      { rep: 2, set_1: 90 },
    ])
  })
})

describe('buildCurrentExerciseProgressUpsert', () => {
  it('links progress to the started session and session exercise row', () => {
    const [sessionExercise] = buildSessionExerciseRowsFromWorkingCopy(
      [sampleExercises[0]],
      'session-1',
      () => 'session-row-1',
    )

    expect(
      buildCurrentExerciseProgressUpsert({
        patientSessionId: 'session-1',
        sessionExercise,
        progressPoints: [{ rep: 1, set_1: 75 }],
      }),
    ).toEqual({
      patientSessionId: 'session-1',
      sessionExerciseId: 'session-row-1',
      value: JSON.stringify([{ rep: 1, set_1: 75 }]),
    })
  })
})

describe('buildSessionProgressUpserts', () => {
  let rowCounter = 0
  const sessionExerciseRows = buildSessionExerciseRowsFromWorkingCopy(
    sampleExercises,
    'session-1',
    () => `session-row-${++rowCounter}`,
  )

  it('persists partial progress for the current exercise after each set', () => {
    const upserts = buildSessionProgressUpserts({
      patientSessionId: 'session-1',
      sessionExerciseRows,
      progressByExerciseId: {},
      currentExerciseIndex: 0,
      currentExerciseProgress: [
        { rep: 1, set_1: 70 },
        { rep: 2, set_1: 80 },
      ],
    })

    expect(upserts).toEqual([
      {
        patientSessionId: 'session-1',
        sessionExerciseId: 'session-row-1',
        value: JSON.stringify([
          { rep: 1, set_1: 70 },
          { rep: 2, set_1: 80 },
        ]),
      },
      {
        patientSessionId: 'session-1',
        sessionExerciseId: 'session-row-2',
        value: JSON.stringify([]),
      },
    ])
  })

  it('retains interrupted-session progress for completed exercises', () => {
    const upserts = buildSessionProgressUpserts({
      patientSessionId: 'session-1',
      sessionExerciseRows,
      progressByExerciseId: {
        'ex-1': [
          { rep: 1, set_1: 100, set_2: 95, set_3: 90 },
          { rep: 2, set_1: 100, set_2: 95, set_3: 90 },
        ],
      },
      currentExerciseIndex: 1,
      currentExerciseProgress: [{ rep: 1, set_1: 55 }],
    })

    expect(JSON.parse(upserts[0]!.value)).toEqual([
      { rep: 1, set_1: 100, set_2: 95, set_3: 90 },
      { rep: 2, set_1: 100, set_2: 95, set_3: 90 },
    ])
    expect(JSON.parse(upserts[1]!.value)).toEqual([{ rep: 1, set_1: 55 }])
  })
})
