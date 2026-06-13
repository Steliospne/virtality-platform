import { describe, expect, it } from 'vitest'
import {
  SessionCompletionSaveChoice,
  ReusableProgramKind,
} from '@virtality/shared/utils'
import {
  buildInitialSessionCompletionDialogState,
  buildSessionCompletionPayload,
  canShowUpdateSourceProgramOption,
} from './session-completion-dialog.ts'

describe('session completion dialog helpers', () => {
  it('initializes save as new with a friendly suggested name', () => {
    expect(
      buildInitialSessionCompletionDialogState('Shoulder rehab').newProgramName,
    ).toBe('Shoulder rehab (session)')
    expect(buildInitialSessionCompletionDialogState(null).newProgramName).toBe(
      'Session program',
    )
  })

  it('shows update source only for active clinician-owned programs', () => {
    expect(
      canShowUpdateSourceProgramOption(
        {
          sourceReusableProgramId: 'program-1',
          sourceProgramName: 'Shoulder rehab',
        },
        {
          id: 'program-1',
          name: 'Shoulder rehab',
          kind: ReusableProgramKind.CLINICIAN_OWNED,
          userId: 'user-1',
          retiredAt: null,
        },
        'user-1',
      ),
    ).toBe(true)

    expect(
      canShowUpdateSourceProgramOption(
        {
          sourceReusableProgramId: null,
          sourceProgramName: null,
        },
        null,
        'user-1',
      ),
    ).toBe(false)
  })

  it('builds completion payload from the final working copy', () => {
    const payload = buildSessionCompletionPayload({
      sessionId: 'session-1',
      saveChoice: SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM,
      newProgramName: 'Quick session plan',
      notes: 'Felt good',
      workingCopy: [
        {
          exerciseId: 'exercise-1',
          sets: 4,
          reps: 12,
          restTime: 5,
          holdTime: 2,
          speed: 1.5,
        },
      ],
      persistedRows: [{ id: 'session-row-1', exerciseId: 'exercise-1' }],
      createId: () => 'unused-id',
    })

    expect(payload).toEqual({
      id: 'session-1',
      saveChoice: SessionCompletionSaveChoice.SAVE_AS_NEW_PROGRAM,
      newProgramName: 'Quick session plan',
      notes: 'Felt good',
      exercises: [
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
      ],
    })
  })
})
