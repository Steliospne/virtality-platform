import { describe, expect, it } from 'vitest'
import type { ExtendedPatientSession, ProgressDataPoint } from '@/types/models'
import { buildSessionListRows } from './session-list-row'

function session(
  id: string,
  at: string,
  options: {
    status?: 'COMPLETED' | 'INTERRUPTED'
    notes?: string | null
    planned?: number
    progress?: ProgressDataPoint[][]
  } = {},
): ExtendedPatientSession {
  const status = options.status ?? 'COMPLETED'
  const planned = options.planned ?? options.progress?.length ?? 0
  return {
    id,
    patientId: 'patient-1',
    programId: null,
    status,
    sourceReusableProgramId: null,
    sourceProgramName: null,
    nprs: null,
    notes: options.notes ?? null,
    deletedAt: null,
    createdAt: new Date(at),
    completedAt:
      status === 'COMPLETED'
        ? new Date(new Date(at).getTime() + 30 * 60_000)
        : null,
    sessionExercise: Array.from({ length: planned }, (_, i) => ({
      id: `${id}-se-${i}`,
      patientSessionId: id,
      exerciseId: `ex-${i}`,
      position: i,
      sets: 1,
      reps: 1,
      restTime: 0,
      holdTime: 1,
      speed: 1,
    })),
    sessionData: (options.progress ?? []).map((points, i) => ({
      id: `${id}-d-${i}`,
      patientSessionId: id,
      sessionExerciseId: `${id}-se-${i}`,
      value: JSON.stringify(points),
    })),
  } as unknown as ExtendedPatientSession
}

describe('buildSessionListRows', () => {
  it('derives the numbers the list shows', () => {
    const [row] = buildSessionListRows([
      session('a', '2026-09-01T09:00:00', {
        notes: 'Felt good',
        planned: 3,
        progress: [[{ rep: 1, set_1: 60 }], [{ rep: 1, set_1: 80 }]],
      }),
    ])

    expect(row.programName).toBe('Quick Start')
    expect(row.durationMin).toBe(30)
    expect(row.exercisesDone).toBe(2)
    expect(row.exercisesPlanned).toBe(3)
    expect(row.avgProgressPct).toBe(70)
    expect(row.bestRepPct).toBe(80)
    expect(row.hasNotes).toBe(true)
    expect(row.progressDeltaPct).toBeNull()
  })

  it('compares progress to the previous session that recorded reps, in date order', () => {
    const rows = buildSessionListRows([
      session('c', '2026-09-10T09:00:00', {
        progress: [[{ rep: 1, set_1: 90 }]],
      }),
      session('b', '2026-09-05T09:00:00', {
        status: 'INTERRUPTED',
        planned: 2,
      }),
      session('a', '2026-09-01T09:00:00', {
        progress: [[{ rep: 1, set_1: 70 }]],
      }),
    ])

    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c'])
    expect(rows[0].progressDeltaPct).toBeNull()
    expect(rows[1].avgProgressPct).toBeNull()
    expect(rows[1].progressDeltaPct).toBeNull()
    expect(rows[2].progressDeltaPct).toBe(20)
  })

  it('leaves scores empty for a session with no recorded reps', () => {
    const [row] = buildSessionListRows([
      session('a', '2026-09-01T09:00:00', {
        status: 'INTERRUPTED',
        planned: 2,
      }),
    ])

    expect(row.durationMin).toBeNull()
    expect(row.exercisesDone).toBe(0)
    expect(row.avgProgressPct).toBeNull()
    expect(row.bestRepPct).toBeNull()
    expect(row.hasNotes).toBe(false)
  })
})
