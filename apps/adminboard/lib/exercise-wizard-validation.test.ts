import type { ExerciseDraftFields } from '@virtality/shared/types'
import { describe, expect, it } from 'vitest'
import {
  collectExerciseWizardClassificationErrors,
  collectExerciseWizardEnableIssues,
  collectExerciseWizardIdentityErrors,
  hasExerciseWizardErrors,
} from './exercise-wizard-validation'

const emptyDraft: ExerciseDraftFields = {
  id: 'draft-1',
  createdBy: 'admin',
  laterality: null,
  exerciseId: '',
  displayName: '',
  unityStem: '',
  unityStemDirty: false,
  description: '',
  category: '',
  item: null,
  image: null,
  video: null,
}

const identityDraft: ExerciseDraftFields = {
  ...emptyDraft,
  laterality: 'pair',
  exerciseId: '420',
  displayName: 'Bicep Curls',
  description: 'Curl slowly.',
}

describe('exercise wizard identity validation', () => {
  it('reports one error per missing identity field', () => {
    const errors = collectExerciseWizardIdentityErrors(emptyDraft)

    expect(errors.laterality).toBeTruthy()
    expect(errors.exerciseId).toBeTruthy()
    expect(errors.displayName).toBeTruthy()
    expect(errors.unityStem).toBeTruthy()
    expect(errors.description).toBeTruthy()
    expect(hasExerciseWizardErrors(errors)).toBe(true)
  })

  it('reports no errors once identity is complete', () => {
    const errors = collectExerciseWizardIdentityErrors(identityDraft)

    expect(errors).toEqual({})
    expect(hasExerciseWizardErrors(errors)).toBe(false)
  })

  it('requires the exercise ID and rejects a malformed one', () => {
    expect(
      collectExerciseWizardIdentityErrors({ ...identityDraft, exerciseId: '' })
        .exerciseId,
    ).toBeTruthy()

    expect(
      collectExerciseWizardIdentityErrors({
        ...identityDraft,
        exerciseId: '42a',
      }).exerciseId,
    ).toBeTruthy()
  })
})

describe('exercise wizard classification validation', () => {
  it('requires category but not item', () => {
    expect(
      collectExerciseWizardClassificationErrors({ category: '' }).category,
    ).toBeTruthy()

    expect(
      collectExerciseWizardClassificationErrors({ category: 'Arms' }),
    ).toEqual({})
  })
})

describe('exercise wizard enable validation', () => {
  it('lists every blocker for an incomplete draft', () => {
    const issues = collectExerciseWizardEnableIssues({
      ...identityDraft,
      exerciseId: '',
      category: '',
    })

    expect(issues).toEqual([
      'Exercise ID is required.',
      'Category is required.',
      'Thumbnail image is required.',
      'Video is required.',
    ])
  })

  it('lists no issues for a complete draft', () => {
    expect(
      collectExerciseWizardEnableIssues({
        ...identityDraft,
        category: 'Legs',
        image: 'https://cdn.virtality.app/a.jpg',
        video: 'https://cdn.virtality.app/a.mp4',
      }),
    ).toEqual([])
  })
})
