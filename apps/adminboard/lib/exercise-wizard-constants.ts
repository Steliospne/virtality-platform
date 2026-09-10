import type { ExerciseDraftLaterality } from '@virtality/shared/types'

export const EXERCISE_WIZARD_LATERALITY_OPTIONS: {
  value: ExerciseDraftLaterality
  label: string
  description: string
}[] = [
  {
    value: 'pair',
    label: 'Left and right pair',
    description: 'Two Console rows with shared media and display name.',
  },
  {
    value: 'single',
    label: 'Single entry',
    description: 'One Console row with direction Both.',
  },
]

export const EXERCISE_WIZARD_CREATE_PATH = '/resources/exercises/new'
export const EXERCISE_WIZARD_EXERCISES_PATH = '/resources/exercises'
export const EXERCISE_WIZARD_PAGE_TITLE = 'Create exercise'

export function exerciseWizardDraftPath(draftId: string): string {
  return `${EXERCISE_WIZARD_CREATE_PATH}/${draftId}`
}
