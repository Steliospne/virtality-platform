export const EXERCISE_WIZARD_STEPS = [
  'identity',
  'classification',
  'media',
  'review',
] as const

export type ExerciseWizardStep = (typeof EXERCISE_WIZARD_STEPS)[number]

export const EXERCISE_WIZARD_STEP_LABELS: Record<ExerciseWizardStep, string> = {
  identity: 'Identity',
  classification: 'Classification',
  media: 'Media',
  review: 'Review',
}

export function exerciseWizardStepIndex(step: ExerciseWizardStep): number {
  return EXERCISE_WIZARD_STEPS.indexOf(step)
}

export function isExerciseWizardStep(
  value: string,
): value is ExerciseWizardStep {
  return (EXERCISE_WIZARD_STEPS as readonly string[]).includes(value)
}
