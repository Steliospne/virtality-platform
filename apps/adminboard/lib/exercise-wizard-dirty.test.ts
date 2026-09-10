import type { ExerciseDraftFields } from '@virtality/shared/types'
import { describe, expect, it } from 'vitest'
import { isExerciseWizardSittingDirty } from './exercise-wizard-dirty'

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

describe('exercise wizard dirty sitting', () => {
  it('is clean for a freshly inserted draft', () => {
    expect(isExerciseWizardSittingDirty(emptyDraft)).toBe(false)
  })

  it('is dirty once laterality or any field is filled', () => {
    expect(
      isExerciseWizardSittingDirty({ ...emptyDraft, laterality: 'pair' }),
    ).toBe(true)
    expect(
      isExerciseWizardSittingDirty({ ...emptyDraft, displayName: 'Move' }),
    ).toBe(true)
    expect(
      isExerciseWizardSittingDirty({
        ...emptyDraft,
        image: 'https://cdn.virtality.app/a.jpg',
      }),
    ).toBe(true)
  })
})
