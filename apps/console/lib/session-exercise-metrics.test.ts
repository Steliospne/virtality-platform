import { describe, expect, it } from 'vitest'
import type { ExtendedPatientSession } from '@/types/models'
import { buildSessionExerciseMetricRows } from './session-exercise-metrics'

const session = {
  id: 'session-1',
  patientId: 'patient-1',
  programId: null,
  status: 'COMPLETED',
  sourceReusableProgramId: null,
  sourceProgramName: null,
  nprs: null,
  notes: null,
  deletedAt: null,
  createdAt: new Date('2026-06-13T10:00:00.000Z'),
  completedAt: new Date('2026-06-13T11:00:00.000Z'),
  sessionExercise: [
    {
      id: 'se-2',
      patientSessionId: 'session-1',
      exerciseId: 'ex-b',
      position: 1,
      sets: 2,
      reps: 5,
      restTime: 0,
      holdTime: 2,
      speed: 1,
    },
    {
      id: 'se-1',
      patientSessionId: 'session-1',
      exerciseId: 'ex-a',
      position: 0,
      sets: 2,
      reps: 3,
      restTime: 0,
      holdTime: 1,
      speed: 1,
    },
  ],
  sessionData: [
    {
      id: 'd-1',
      patientSessionId: 'session-1',
      sessionExerciseId: 'se-1',
      value: JSON.stringify([
        { rep: 1, set_1: 50, set_2: 100 },
        { rep: 2, set_1: 50, set_2: 100 },
        { rep: 3, set_1: 50, set_2: 100 },
      ]),
    },
  ],
} as unknown as ExtendedPatientSession

describe('buildSessionExerciseMetricRows', () => {
  const rows = buildSessionExerciseMetricRows(session)

  it('orders rows by program position', () => {
    expect(rows.map((r) => r.exerciseId)).toEqual(['ex-a', 'ex-b'])
  })

  it('joins per-exercise metrics on sessionExerciseId', () => {
    const [recorded] = rows
    expect(recorded.sets).toBe(2)
    expect(recorded.reps).toBe(3)
    expect(recorded.avgProgressPct).toBe(75)
    expect(recorded.bestRepPct).toBe(100)
    expect(recorded.consistencySd).toBe(25)
    expect(recorded.fatigueDropOffPct).toBe(0)
    expect(recorded.firstToLastSetPct).toBe(100)
  })

  it('leaves score fields empty for an exercise with no recorded reps', () => {
    const [, skipped] = rows
    expect(skipped.avgProgressPct).toBeNull()
    expect(skipped.bestRepPct).toBeNull()
    expect(skipped.consistencySd).toBeNull()
    expect(skipped.fatigueDropOffPct).toBeNull()
    expect(skipped.firstToLastSetPct).toBeNull()
  })
})
