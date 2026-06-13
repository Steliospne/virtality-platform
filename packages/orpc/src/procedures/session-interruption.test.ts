import { describe, expect, it, vi } from 'vitest'
import { interruptPatientSession } from './session-interruption.ts'

const activeSession = {
  id: 'session-1',
  status: 'ACTIVE',
  sessionExercise: [{ id: 'row-1' }, { id: 'row-2' }],
  sessionData: [{ id: 'progress-1' }],
}

describe('interruptPatientSession', () => {
  it('marks an active session as interrupted without completing it', async () => {
    const patientSession = {
      findFirst: vi.fn().mockResolvedValue(activeSession),
      update: vi.fn().mockResolvedValue({
        id: 'session-1',
        status: 'INTERRUPTED',
        completedAt: null,
      }),
    }

    const result = await interruptPatientSession(patientSession, 'session-1')

    expect(patientSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { status: 'INTERRUPTED' },
    })
    expect(result).toEqual({
      session: {
        id: 'session-1',
        status: 'INTERRUPTED',
        completedAt: null,
      },
      retainedExerciseCount: 2,
      retainedProgressCount: 1,
    })
  })

  it('rejects interrupting completed sessions', async () => {
    const patientSession = {
      findFirst: vi.fn().mockResolvedValue({
        ...activeSession,
        status: 'COMPLETED',
      }),
      update: vi.fn(),
    }

    await expect(
      interruptPatientSession(patientSession, 'session-1'),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(patientSession.update).not.toHaveBeenCalled()
  })
})
