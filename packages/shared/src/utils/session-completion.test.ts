import { describe, expect, it } from 'vitest'
import {
  ReusableProgramKind,
  type ReusableProgramRecord,
} from './reusable-program.ts'
import {
  SessionCompletionSaveChoice,
  assertCompletionSaveChoiceAllowed,
  assertSessionCanBeCompleted,
  assertSessionExerciseRowsMutable,
  buildCompletionSessionExerciseRows,
  buildSaveAsNewProgramName,
  canOfferUpdateSourceProgram,
  mapSessionExercisesToReusableProgramExercises,
} from './session-completion.ts'

const clinicianProgram: ReusableProgramRecord = {
  id: 'program-1',
  name: 'Shoulder rehab',
  kind: ReusableProgramKind.CLINICIAN_OWNED,
  userId: 'user-1',
  retiredAt: null,
}

describe('session completion helpers', () => {
  it('requires active sessions for completion', () => {
    expect(() => assertSessionCanBeCompleted('ACTIVE')).not.toThrow()
    expect(() => assertSessionCanBeCompleted('COMPLETED')).toThrow(
      /only active sessions/i,
    )
  })

  it('allows session exercise row changes only while the session is active', () => {
    expect(() => assertSessionExerciseRowsMutable('ACTIVE')).not.toThrow()
    expect(() => assertSessionExerciseRowsMutable('COMPLETED')).toThrow(
      /cannot be modified/i,
    )
    expect(() => assertSessionExerciseRowsMutable('INTERRUPTED')).toThrow(
      /cannot be modified/i,
    )
  })

  it('offers update source only for active clinician-owned source programs', () => {
    const session = {
      sourceReusableProgramId: 'program-1',
      sourceProgramName: 'Shoulder rehab',
    }

    expect(
      canOfferUpdateSourceProgram(session, clinicianProgram, 'user-1'),
    ).toBe(true)
    expect(
      canOfferUpdateSourceProgram(
        session,
        { ...clinicianProgram, retiredAt: new Date() },
        'user-1',
      ),
    ).toBe(false)
    expect(
      canOfferUpdateSourceProgram(session, clinicianProgram, 'user-2'),
    ).toBe(false)
    expect(
      canOfferUpdateSourceProgram(
        { ...session, sourceReusableProgramId: null },
        clinicianProgram,
        'user-1',
      ),
    ).toBe(false)
  })

  it('suggests friendly names for save as new', () => {
    expect(buildSaveAsNewProgramName('Shoulder rehab')).toBe(
      'Shoulder rehab (session)',
    )
    expect(buildSaveAsNewProgramName(null)).toBe('Session program')
  })

  it('builds completion rows from the final working copy while preserving row ids', () => {
    const rows = buildCompletionSessionExerciseRows(
      [
        {
          exerciseId: 'exercise-1',
          sets: 4,
          reps: 12,
          restTime: 5,
          holdTime: 2,
          speed: 1.5,
        },
      ],
      [{ id: 'session-row-1', exerciseId: 'exercise-1' }],
      () => 'new-row-id',
    )

    expect(rows).toEqual([
      {
        id: 'session-row-1',
        exerciseId: 'exercise-1',
        position: 0,
        sets: 4,
        reps: 12,
        restTime: 5,
        holdTime: 2,
        speed: 1.5,
      },
    ])
  })

  it('maps session exercises into reusable program exercises', () => {
    const mapped = mapSessionExercisesToReusableProgramExercises(
      [
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
      'program-copy',
      () => 'program-exercise-1',
    )

    expect(mapped).toEqual([
      {
        id: 'program-exercise-1',
        reusableProgramId: 'program-copy',
        exerciseId: 'exercise-1',
        position: 0,
        sets: 3,
        reps: 10,
        restTime: 5,
        holdTime: 1,
        speed: 1,
      },
    ])
  })

  it('validates completion save choices', () => {
    const session = {
      sourceReusableProgramId: 'program-1',
      sourceProgramName: 'Shoulder rehab',
    }

    expect(() =>
      assertCompletionSaveChoiceAllowed(
        SessionCompletionSaveChoice.FINISH_ONLY,
        session,
        clinicianProgram,
        'user-1',
        1,
      ),
    ).not.toThrow()

    expect(() =>
      assertCompletionSaveChoiceAllowed(
        SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM,
        session,
        clinicianProgram,
        'user-1',
        1,
      ),
    ).not.toThrow()

    expect(() =>
      assertCompletionSaveChoiceAllowed(
        SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM,
        session,
        clinicianProgram,
        'user-1',
        1,
        'Quick session plan',
      ),
    ).not.toThrow()

    expect(() =>
      assertCompletionSaveChoiceAllowed(
        SessionCompletionSaveChoice.UPDATE_SOURCE_PROGRAM,
        { ...session, sourceReusableProgramId: null },
        null,
        'user-1',
        1,
      ),
    ).toThrow(/cannot update the source reusable program/i)
  })
})
