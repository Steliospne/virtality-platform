import { describe, expect, it } from 'vitest'
import type { ExtendedPatientSession, ProgressDataPoint } from '@/types/models'
import {
  GAP_THRESHOLD_DAYS,
  getFatigueIndex,
  getSessionExerciseQualityAvg,
  getVisitConsistency,
} from './session-metrics'
import {
  filterSessionsByDateRange,
  getSessionDateRangeForPreset,
} from './session-date-range'

const baseSession = {
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
  sessionExercise: [],
  sessionData: [],
} as unknown as ExtendedPatientSession

function completedSession(
  id: string,
  completedAt: string,
  exerciseProgress: ProgressDataPoint[][] = [],
): ExtendedPatientSession {
  return {
    ...baseSession,
    id,
    createdAt: new Date(completedAt),
    completedAt: new Date(completedAt),
    sessionData: exerciseProgress.map((points, index) => ({
      id: `${id}-data-${index}`,
      patientSessionId: id,
      sessionExerciseId: `${id}-exercise-${index}`,
      value: JSON.stringify(points),
    })),
  } as ExtendedPatientSession
}

describe('getVisitConsistency', () => {
  it('flags a gap longer than the clinical threshold inside a 30-day range', () => {
    const range = getSessionDateRangeForPreset(
      'month',
      new Date('2026-09-19T12:00:00.000Z'),
    )
    const sessions = filterSessionsByDateRange(
      [
        completedSession('a', '2026-08-25T09:00:00.000Z'),
        completedSession('b', '2026-09-18T09:00:00.000Z'),
      ],
      range,
    )

    const { avgDaysBetween, gaps } = getVisitConsistency(sessions)

    expect(sessions).toHaveLength(2)
    expect(avgDaysBetween).toBe(24)
    expect(gaps).toHaveLength(1)
    expect(gaps[0].daysBetween).toBeGreaterThan(GAP_THRESHOLD_DAYS)
  })

  it('does not flag visits within the threshold', () => {
    const { gaps } = getVisitConsistency([
      completedSession('a', '2026-09-01T09:00:00.000Z'),
      completedSession('b', '2026-09-05T09:00:00.000Z'),
      completedSession('c', '2026-09-08T09:00:00.000Z'),
    ])

    expect(gaps).toHaveLength(0)
  })
})

describe('getSessionExerciseQualityAvg', () => {
  it('averages each rep over the sets it actually has', () => {
    // set_1 done for 3 reps, set_2 stopped after 1 rep
    const session = completedSession('a', '2026-09-01T09:00:00.000Z', [
      [
        { rep: 1, set_1: 80, set_2: 60 },
        { rep: 2, set_1: 80 },
        { rep: 3, set_1: 80 },
      ],
    ])

    expect(getSessionExerciseQualityAvg(session)).toBeCloseTo(76.67, 2)
  })

  it('ignores key order when picking set scores', () => {
    const session = completedSession('a', '2026-09-01T09:00:00.000Z', [
      [{ set_1: 50, rep: 1 } as ProgressDataPoint, { set_1: 100, rep: 2 }],
    ])

    expect(getSessionExerciseQualityAvg(session)).toBe(75)
  })
})

describe('getFatigueIndex', () => {
  const setOneStrongSetTwoWeak = [
    { rep: 1, set_1: 100, set_2: 10 },
    { rep: 2, set_1: 100, set_2: 10 },
    { rep: 3, set_1: 100, set_2: 10 },
  ]

  it('compares the start of the exercise to its end across sets', () => {
    const session = completedSession('a', '2026-09-01T09:00:00.000Z', [
      setOneStrongSetTwoWeak,
    ])

    expect(getFatigueIndex(session, 'across-exercise').sessionDropOffPct).toBe(
      90,
    )
  })

  it('reports no within-set drop-off when each set is flat', () => {
    const session = completedSession('a', '2026-09-01T09:00:00.000Z', [
      setOneStrongSetTwoWeak,
    ])

    expect(getFatigueIndex(session, 'within-set').sessionDropOffPct).toBe(0)
  })
})
