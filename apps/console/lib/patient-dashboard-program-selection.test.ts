import { describe, expect, it } from 'vitest'
import {
  buildProgramSelectionState,
  isSessionCopyIsolatedFromLibrary,
  orderProgramsForDashboardSelection,
  resolveLastUsedProgram,
  reusableProgramExercisesToSessionCopy,
  type DashboardReusableProgram,
} from './patient-dashboard-program-selection.js'

const sampleExercises = [
  {
    id: 'row-1',
    reusableProgramId: 'program-1',
    exerciseId: 'ex-1',
    position: 0,
    sets: 3,
    reps: 10,
    restTime: 5,
    holdTime: 1,
    speed: 1,
  },
  {
    id: 'row-2',
    reusableProgramId: 'program-1',
    exerciseId: 'ex-2',
    position: 1,
    sets: 2,
    reps: 8,
    restTime: 4,
    holdTime: 2,
    speed: 1.5,
  },
]

const samplePrograms: DashboardReusableProgram[] = [
  {
    id: 'program-1',
    name: 'Shoulder rehab',
    kind: 'CLINICIAN_OWNED',
    userId: 'user-1',
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    retiredAt: null,
    exercises: sampleExercises,
  },
  {
    id: 'program-2',
    name: 'Wrist mobility',
    kind: 'CLINICIAN_OWNED',
    userId: 'user-1',
    createdAt: new Date('2026-06-02T00:00:00.000Z'),
    updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    retiredAt: null,
    exercises: [],
  },
]

describe('patient dashboard reusable program selection', () => {
  it('maps reusable program exercises into a session working copy', () => {
    expect(reusableProgramExercisesToSessionCopy(sampleExercises)).toEqual([
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
    ])
  })

  it('preselects the last used reusable program from convenience state', () => {
    expect(resolveLastUsedProgram(samplePrograms, 'program-2')).toEqual(
      samplePrograms[1],
    )
    expect(resolveLastUsedProgram(samplePrograms, 'missing')).toBeNull()
    expect(resolveLastUsedProgram(undefined, 'program-1')).toBeNull()
  })

  it('orders the last used program first for dashboard selection', () => {
    expect(
      orderProgramsForDashboardSelection(samplePrograms, 'program-2'),
    ).toEqual([samplePrograms[1], samplePrograms[0]])
  })

  it('builds dashboard state from a selected reusable program', () => {
    expect(
      buildProgramSelectionState(samplePrograms[0]!, {
        id: null,
        currentRep: 0,
        currentSet: 0,
        totalReps: 0,
        totalSets: 0,
      }),
    ).toEqual({
      selectedProgram: samplePrograms[0],
      exercises: reusableProgramExercisesToSessionCopy(sampleExercises),
      activeExerciseData: {
        id: 'ex-1',
        currentRep: 0,
        currentSet: 0,
        totalReps: 10,
        totalSets: 3,
      },
    })
  })
})

describe('patient dashboard session copy isolation', () => {
  it('starts aligned with the library program without sharing mutable references', () => {
    const sessionExercises =
      reusableProgramExercisesToSessionCopy(sampleExercises)

    expect(
      isSessionCopyIsolatedFromLibrary(sampleExercises, sessionExercises),
    ).toBe(true)

    sessionExercises[0]!.sets = 99
    expect(sampleExercises[0]!.sets).toBe(3)
    expect(
      isSessionCopyIsolatedFromLibrary(sampleExercises, sessionExercises),
    ).toBe(false)
  })
})
