import type { ExerciseDraftFields } from '@virtality/shared/types'

export function isExerciseWizardSittingDirty(
  draft: Pick<
    ExerciseDraftFields,
    | 'laterality'
    | 'displayName'
    | 'unityStem'
    | 'unityStemDirty'
    | 'description'
    | 'category'
    | 'item'
    | 'image'
    | 'video'
  >,
): boolean {
  const hasText = (value: string | null | undefined) => Boolean(value?.trim())

  return (
    draft.laterality != null ||
    hasText(draft.displayName) ||
    (draft.unityStemDirty && hasText(draft.unityStem)) ||
    hasText(draft.description) ||
    hasText(draft.category) ||
    hasText(draft.item) ||
    hasText(draft.image) ||
    hasText(draft.video)
  )
}
