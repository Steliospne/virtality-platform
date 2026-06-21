import { describe, expect, it, vi } from 'vitest'
import { createPatientSessionFromAck } from './session-start-from-ack.ts'

const sessionInput = {
  id: 'session-1',
  patientId: 'patient-1',
  programId: null,
  status: 'ACTIVE' as const,
  sourceReusableProgramId: 'program-1',
  sourceProgramName: 'Shoulder rehab',
  nprs: null,
  notes: null,
  createdAt: new Date('2026-06-21T00:00:00.000Z'),
  completedAt: null,
  deletedAt: null,
}

const exerciseRows = [
  {
    id: 'session-row-1',
    exerciseId: 'ex-1',
    position: 0,
    sets: 3,
    reps: 10,
    restTime: 5,
    holdTime: 1,
    speed: 1,
  },
  {
    id: 'session-row-2',
    exerciseId: 'ex-2',
    position: 1,
    sets: 2,
    reps: 8,
    restTime: 4,
    holdTime: 2,
    speed: 1.5,
  },
]

describe('createPatientSessionFromAck', () => {
  it('creates the started session and session exercise rows together', async () => {
    const patientSession = {
      create: vi.fn().mockResolvedValue(sessionInput),
    }
    const sessionExercise = {
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
    }

    const result = await createPatientSessionFromAck(
      { patientSession, sessionExercise },
      { session: sessionInput, exercises: exerciseRows },
    )

    expect(patientSession.create).toHaveBeenCalledWith({ data: sessionInput })
    expect(sessionExercise.createMany).toHaveBeenCalledWith({
      data: exerciseRows.map((exercise) => ({
        ...exercise,
        patientSessionId: 'session-1',
      })),
    })
    expect(result).toEqual(sessionInput)
  })

  it('stores quick start sessions without a source reusable program', async () => {
    const quickStartSession = {
      ...sessionInput,
      sourceReusableProgramId: null,
      sourceProgramName: null,
    }
    const patientSession = {
      create: vi.fn().mockResolvedValue(quickStartSession),
    }
    const sessionExercise = {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    }

    await createPatientSessionFromAck(
      { patientSession, sessionExercise },
      {
        session: quickStartSession,
        exercises: [exerciseRows[0]!],
      },
    )

    expect(patientSession.create).toHaveBeenCalledWith({
      data: quickStartSession,
    })
  })
})
