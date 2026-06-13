import { describe, expect, it, vi } from 'vitest'
import {
  SessionCompletionSaveChoice,
  type SessionExerciseSnapshotRow,
} from '@virtality/shared/utils'
import {
  completePatientSessionWithSaveChoice,
  replaceSessionExerciseRows,
} from './session-completion.ts'

const baseSession = {
  id: 'session-1',
  status: 'ACTIVE',
  sourceReusableProgramId: 'program-1',
  sourceProgramName: 'Shoulder rehab',
  sessionExercise: [
    {
      id: 'session-row-1',
      exerciseId: 'exercise-1',
      position: 0,
      sets: 3,
      reps: 10,
      restTime: 5,
      holdTime: 1,
      speed: 1,
    },
  ],
}

const updatedExercise: SessionExerciseSnapshotRow = {
  id: 'session-row-1',
  exerciseId: 'exercise-1',
  position: 0,
  sets: 4,
  reps: 12,
  restTime: 5,
  holdTime: 2,
  speed: 1.5,
}

function createDeps(
  overrides: Partial<
    Parameters<typeof completePatientSessionWithSaveChoice>[0]
  > = {},
) {
  const patientSession = {
    findFirst: vi.fn().mockResolvedValue(baseSession),
    update: vi.fn().mockResolvedValue({
      id: 'session-1',
      status: 'COMPLETED',
      sourceProgramName: 'Shoulder rehab',
      completedAt: new Date('2026-06-13T12:00:00.000Z'),
    }),
  }

  const sessionExercise = {
    findMany: vi.fn().mockResolvedValue(baseSession.sessionExercise),
    deleteMany: vi.fn().mockResolvedValue(undefined),
    createMany: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  }

  const reusableProgram = {
    findFirst: vi.fn().mockResolvedValue({
      id: 'program-1',
      name: 'Shoulder rehab',
      kind: 'CLINICIAN_OWNED',
      userId: 'user-1',
      retiredAt: null,
    }),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  }

  const reusableProgramExercise = {
    findMany: vi.fn().mockResolvedValue([
      {
        id: 'program-exercise-1',
        reusableProgramId: 'program-1',
        exerciseId: 'exercise-1',
        position: 0,
        sets: 3,
        reps: 10,
        restTime: 5,
        holdTime: 1,
        speed: 1,
      },
    ]),
    deleteMany: vi.fn().mockResolvedValue(undefined),
    createMany: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  }

  return {
    patientSession,
    sessionExercise,
    reusableProgram,
    reusableProgramExercise,
    now: new Date('2026-06-13T12:00:00.000Z'),
    createId: vi
      .fn()
      .mockReturnValueOnce('new-program-id')
      .mockReturnValueOnce('new-program-exercise-id'),
    ...overrides,
  }
}

describe('completePatientSessionWithSaveChoice', () => {
  it('completes with finish only and preserves the stored source program name', async () => {
    const deps = createDeps()

    const result = await completePatientSessionWithSaveChoice(deps, 'user-1', {
      id: 'session-1',
      saveChoice: SessionCompletionSaveChoice.FINISH_ONLY,
    })

    expect(result.sourceProgramName).toBe('Shoulder rehab')
    expect(deps.patientSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: {
        status: 'COMPLETED',
        completedAt: deps.now,
      },
    })
    expect(deps.reusableProgram.update).not.toHaveBeenCalled()
    expect(deps.reusableProgram.create).not.toHaveBeenCalled()
  })

  it('freezes the final working copy before completing', async () => {
    const deps = createDeps()

    await completePatientSessionWithSaveChoice(deps, 'user-1', {
      id: 'session-1',
      saveChoice: SessionCompletionSaveChoice.FINISH_ONLY,
      exercises: [updatedExercise],
    })

    expect(deps.sessionExercise.update).toHaveBeenCalledWith({
      where: { id: 'session-row-1' },
      data: {
        patientSessionId: 'session-1',
        exerciseId: 'exercise-1',
        position: 0,
        sets: 4,
        reps: 12,
        restTime: 5,
        holdTime: 2,
        speed: 1.5,
      },
    })
  })

  it('overwrites the source reusable program after update choice', async () => {
    const deps = createDeps()

    await completePatientSessionWithSaveChoice(deps, 'user-1', {
      id: 'session-1',
      saveChoice: SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM,
      exercises: [updatedExercise],
    })

    expect(deps.reusableProgramExercise.deleteMany).toHaveBeenCalled()
    expect(deps.reusableProgramExercise.createMany).toHaveBeenCalled()
    expect(deps.reusableProgram.update).toHaveBeenCalledWith({
      where: { id: 'program-1' },
      data: { updatedAt: deps.now },
    })
  })

  it('creates a new reusable program for quick start save as new', async () => {
    const deps = createDeps({
      patientSession: {
        findFirst: vi.fn().mockResolvedValue({
          ...baseSession,
          sourceReusableProgramId: null,
          sourceProgramName: null,
          sessionExercise: [updatedExercise],
        }),
        update: vi.fn().mockResolvedValue({
          id: 'session-1',
          status: 'COMPLETED',
          sourceProgramName: null,
          completedAt: new Date('2026-06-13T12:00:00.000Z'),
        }),
      },
      reusableProgram: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
      },
      reusableProgramExercise: {
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue(undefined),
        createMany: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
      },
    })

    await completePatientSessionWithSaveChoice(deps, 'user-1', {
      id: 'session-1',
      saveChoice: SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM,
      newProgramName: 'Quick session plan',
      exercises: [updatedExercise],
    })

    expect(deps.reusableProgram.create).toHaveBeenCalledWith({
      data: {
        id: 'new-program-id',
        name: 'Quick session plan',
        kind: 'CLINICIAN_OWNED',
        userId: 'user-1',
        createdAt: deps.now,
        updatedAt: deps.now,
        retiredAt: null,
      },
    })
    expect(deps.reusableProgramExercise.createMany).toHaveBeenCalled()
  })

  it('rejects update source when no clinician-owned source exists', async () => {
    const deps = createDeps({
      patientSession: {
        findFirst: vi.fn().mockResolvedValue({
          ...baseSession,
          sourceReusableProgramId: null,
          sourceProgramName: null,
        }),
        update: vi.fn(),
      },
      reusableProgram: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
      },
    })

    await expect(
      completePatientSessionWithSaveChoice(deps, 'user-1', {
        id: 'session-1',
        saveChoice: SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM,
        exercises: [updatedExercise],
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
  })
})

describe('replaceSessionExerciseRows', () => {
  it('replaces, updates, and deletes rows to match the final snapshot', async () => {
    const sessionExercise = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'session-row-1',
          exerciseId: 'exercise-1',
          position: 0,
          sets: 3,
          reps: 10,
          restTime: 5,
          holdTime: 1,
          speed: 1,
        },
        {
          id: 'session-row-2',
          exerciseId: 'exercise-2',
          position: 1,
          sets: 2,
          reps: 8,
          restTime: 4,
          holdTime: 1,
          speed: 1,
        },
      ]),
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    }

    await replaceSessionExerciseRows(sessionExercise, 'session-1', [
      updatedExercise,
      {
        id: 'session-row-3',
        exerciseId: 'exercise-3',
        position: 1,
        sets: 2,
        reps: 8,
        restTime: 4,
        holdTime: 1,
        speed: 1,
      },
    ])

    expect(sessionExercise.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['session-row-2'] } },
    })
    expect(sessionExercise.createMany).toHaveBeenCalled()
    expect(sessionExercise.update).toHaveBeenCalled()
  })
})
