import type { ExerciseDraftFields } from '@virtality/shared/types'
import { describe, expect, it } from 'vitest'
import {
  canAdvanceExerciseWizardClassificationStep,
  canAdvanceExerciseWizardIdentityStep,
  canAdvanceExerciseWizardMediaStep,
  canEnableExerciseDraftInConsole,
} from './exercise-wizard-gates'

const emptyDraft: ExerciseDraftFields = {
  id: 'draft-1',
  createdBy: 'admin',
  laterality: null,
  displayName: '',
  unityStem: '',
  unityStemDirty: false,
  description: '',
  category: '',
  item: null,
  image: null,
  video: null,
}

describe('exercise wizard step gates', () => {
  it('blocks Identity Next until required fields are present', () => {
    expect(canAdvanceExerciseWizardIdentityStep(emptyDraft)).toBe(false)

    expect(
      canAdvanceExerciseWizardIdentityStep({
        ...emptyDraft,
        laterality: 'pair',
        displayName: 'Bicep Curls',
        description: 'Curl slowly.',
        unityStemDirty: false,
      }),
    ).toBe(true)
  })

  it('allows Media Next while Identity Next is still blocked', () => {
    expect(canAdvanceExerciseWizardIdentityStep(emptyDraft)).toBe(false)
    expect(canAdvanceExerciseWizardMediaStep()).toBe(true)
  })

  it('requires category on Classification Next but not item', () => {
    expect(
      canAdvanceExerciseWizardClassificationStep({
        ...emptyDraft,
        category: '',
      }),
    ).toBe(false)

    expect(
      canAdvanceExerciseWizardClassificationStep({
        category: 'Arms',
      }),
    ).toBe(true)
  })

  it('reflects promotion readiness for Enable in Console', () => {
    const incomplete = canEnableExerciseDraftInConsole({
      ...emptyDraft,
      laterality: 'single',
      displayName: 'Move',
      description: 'Do it.',
      category: 'Legs',
    })
    expect(incomplete.ready).toBe(false)

    const complete = canEnableExerciseDraftInConsole({
      ...emptyDraft,
      laterality: 'single',
      displayName: 'Move',
      description: 'Do it.',
      category: 'Legs',
      image: 'https://cdn.virtality.app/a.jpg',
      video: 'https://cdn.virtality.app/a.mp4',
    })
    expect(complete).toEqual({ ready: true })
  })
})
