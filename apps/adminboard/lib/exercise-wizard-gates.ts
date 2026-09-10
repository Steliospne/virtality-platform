import type { ExerciseDraftFields } from '@virtality/shared/types'
import {
  assessExerciseProductionReadiness,
  deriveExerciseNamesFromDraft,
  getEffectiveUnityStem,
  validateUnityStem,
} from '@virtality/shared/utils'

export function canAdvanceExerciseWizardIdentityStep(
  draft: Pick<
    ExerciseDraftFields,
    | 'laterality'
    | 'displayName'
    | 'description'
    | 'unityStem'
    | 'unityStemDirty'
  >,
): boolean {
  if (!draft.laterality) {
    return false
  }

  if (!draft.displayName.trim() || !draft.description.trim()) {
    return false
  }

  const stem = getEffectiveUnityStem(draft)
  return validateUnityStem(stem) === null
}

export function canAdvanceExerciseWizardClassificationStep(
  draft: Pick<ExerciseDraftFields, 'category'>,
): boolean {
  return draft.category.trim().length > 0
}

export function canAdvanceExerciseWizardMediaStep(): boolean {
  return true
}

export function canEnableExerciseDraftInConsole(
  draft: ExerciseDraftFields,
): ReturnType<typeof assessExerciseProductionReadiness> {
  const derived = deriveExerciseNamesFromDraft(draft)[0]
  if (!derived) {
    return { ready: false, missing: ['laterality', 'name', 'direction'] }
  }

  return assessExerciseProductionReadiness({
    displayName: draft.displayName,
    name: derived.name,
    category: draft.category,
    direction: derived.direction,
    description: draft.description,
    image: draft.image,
    video: draft.video,
  })
}
