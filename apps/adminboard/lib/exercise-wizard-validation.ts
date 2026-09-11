import type { ExerciseDraftFields } from '@virtality/shared/types'
import {
  assessExerciseProductionReadiness,
  deriveExerciseNamesFromDraft,
  getEffectiveUnityStem,
  validateExerciseId,
  validateUnityStem,
} from '@virtality/shared/utils'

export type ExerciseWizardIdentityErrors = {
  laterality?: string
  exerciseId?: string
  displayName?: string
  unityStem?: string
  description?: string
}

export type ExerciseWizardClassificationErrors = {
  category?: string
}

const MISSING_FIELD_MESSAGES: Record<string, string | undefined> = {
  displayName: 'Display name is required.',
  name: 'Unity stem is required.',
  category: 'Category is required.',
  direction: 'Laterality is required.',
  description: 'Description is required.',
  image: 'Thumbnail image is required.',
  video: 'Video is required.',
}

function missingFieldMessage(field: string): string {
  return MISSING_FIELD_MESSAGES[field] ?? `${field} is required.`
}

export function collectExerciseWizardIdentityErrors(
  draft: Pick<
    ExerciseDraftFields,
    | 'laterality'
    | 'exerciseId'
    | 'displayName'
    | 'description'
    | 'unityStem'
    | 'unityStemDirty'
  >,
): ExerciseWizardIdentityErrors {
  const errors: ExerciseWizardIdentityErrors = {}

  if (!draft.laterality) {
    errors.laterality = 'Choose a left and right pair or a single entry.'
  }

  const exerciseIdError = validateExerciseId(draft.exerciseId)
  if (exerciseIdError) {
    errors.exerciseId = exerciseIdError
  }

  if (!draft.displayName.trim()) {
    errors.displayName = missingFieldMessage('displayName')
  }

  const stemError = validateUnityStem(getEffectiveUnityStem(draft))
  if (stemError) {
    errors.unityStem = stemError
  }

  if (!draft.description.trim()) {
    errors.description = missingFieldMessage('description')
  }

  return errors
}

export function collectExerciseWizardClassificationErrors(
  draft: Pick<ExerciseDraftFields, 'category'>,
): ExerciseWizardClassificationErrors {
  if (draft.category.trim()) {
    return {}
  }

  return { category: missingFieldMessage('category') }
}

/**
 * Review sits downstream of every field, so its issues read as a list rather
 * than as per-field errors.
 */
export function collectExerciseWizardEnableIssues(
  draft: ExerciseDraftFields,
): string[] {
  const issues: string[] = []

  const exerciseIdError = validateExerciseId(draft.exerciseId)
  if (exerciseIdError) {
    issues.push(exerciseIdError)
  }

  const derived = deriveExerciseNamesFromDraft(draft)[0]
  if (!derived) {
    issues.push(missingFieldMessage('direction'), missingFieldMessage('name'))
    return issues
  }

  const readiness = assessExerciseProductionReadiness({
    displayName: draft.displayName,
    name: derived.name,
    category: draft.category,
    direction: derived.direction,
    description: draft.description,
    image: draft.image,
    video: draft.video,
  })

  if (!readiness.ready) {
    for (const field of readiness.missing) {
      issues.push(missingFieldMessage(field))
    }
  }

  return issues
}

export function hasExerciseWizardErrors(errors: object): boolean {
  return Object.values(errors).some((message) => Boolean(message))
}
