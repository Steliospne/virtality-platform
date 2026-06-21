import { describe, expect, it, vi } from 'vitest'
import { syncSessionWorkingCopy } from './session-working-copy.ts'

const updatedExercise = {
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
  overrides: Partial<Parameters<typeof syncSessionWorkingCopy>[0]> = {},
) {
  const patientSession = {
    findFirst: vi.fn().mockResolvedValue({
      id: 'session-1',
      status: 'ACTIVE',
    }),
  }

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
    ]),
    deleteMany: vi.fn().mockResolvedValue(undefined),
    createMany: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  }

  return {
    patientSession,
    sessionExercise,
    ...overrides,
  }
}

describe('syncSessionWorkingCopy', () => {
  it('persists live session exercise changes while the session is active', async () => {
    const deps = createDeps()

    const result = await syncSessionWorkingCopy(deps, {
      id: 'session-1',
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
    expect(result).toEqual({
      id: 'session-1',
      exercises: [updatedExercise],
    })
  })

  it('rejects syncing exercise rows for completed sessions', async () => {
    const deps = createDeps({
      patientSession: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'session-1',
          status: 'COMPLETED',
        }),
      },
    })

    await expect(
      syncSessionWorkingCopy(deps, {
        id: 'session-1',
        exercises: [updatedExercise],
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(deps.sessionExercise.update).not.toHaveBeenCalled()
  })

  it('rejects syncing exercise rows for interrupted sessions', async () => {
    const deps = createDeps({
      patientSession: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'session-1',
          status: 'INTERRUPTED',
        }),
      },
    })

    await expect(
      syncSessionWorkingCopy(deps, {
        id: 'session-1',
        exercises: [updatedExercise],
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
  })
})
