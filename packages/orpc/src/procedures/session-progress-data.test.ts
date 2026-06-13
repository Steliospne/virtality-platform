import { describe, expect, it, vi } from 'vitest'
import { upsertSessionProgressRecords } from './session-progress-data.ts'

describe('upsertSessionProgressRecords', () => {
  it('creates progress linked to the session exercise on first set end', async () => {
    const findFirst = vi.fn().mockResolvedValue(null)
    const create = vi.fn().mockResolvedValue(undefined)
    const update = vi.fn()

    await upsertSessionProgressRecords(
      {
        sessionData: { findFirst, create, update },
      },
      [
        {
          patientSessionId: 'session-1',
          sessionExerciseId: 'session-row-1',
          value: JSON.stringify([{ rep: 1, set_1: 70 }]),
        },
      ],
      () => 'progress-row-1',
    )

    expect(create).toHaveBeenCalledWith({
      data: {
        id: 'progress-row-1',
        patientSessionId: 'session-1',
        sessionExerciseId: 'session-row-1',
        value: JSON.stringify([{ rep: 1, set_1: 70 }]),
      },
    })
    expect(update).not.toHaveBeenCalled()
  })

  it('updates existing progress for later sets and exercises', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ id: 'progress-row-1' })
      .mockResolvedValueOnce(null)
    const create = vi.fn().mockResolvedValue(undefined)
    const update = vi.fn().mockResolvedValue(undefined)

    await upsertSessionProgressRecords(
      {
        sessionData: { findFirst, create, update },
      },
      [
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
          value: JSON.stringify([{ rep: 1, set_1: 55 }]),
        },
      ],
      () => 'progress-row-2',
    )

    expect(update).toHaveBeenCalledWith({
      where: { id: 'progress-row-1' },
      data: {
        value: JSON.stringify([
          { rep: 1, set_1: 70 },
          { rep: 2, set_1: 80 },
        ]),
      },
    })
    expect(create).toHaveBeenCalledWith({
      data: {
        id: 'progress-row-2',
        patientSessionId: 'session-1',
        sessionExerciseId: 'session-row-2',
        value: JSON.stringify([{ rep: 1, set_1: 55 }]),
      },
    })
  })
})
