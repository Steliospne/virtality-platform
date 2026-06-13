import type { Exercise } from '@virtality/db'

export const STANDARD_PROGRAM_EXERCISE_SETTINGS = {
  sets: 3,
  reps: 10,
  restTime: 5,
  holdTime: 1,
  speed: 1.0,
} as const

export type StarterTemplateExerciseRow = {
  exerciseId: string
  position: number
  sets: number
  reps: number
  restTime: number
  holdTime: number
  speed: number
}

export type ExerciseCatalogRow = Pick<
  Exercise,
  'id' | 'displayName' | 'direction' | 'enabled'
>

export type StarterTemplateEditorExercise = {
  id: string
  exerciseId: string
  exercise: Exercise
} & typeof STANDARD_PROGRAM_EXERCISE_SETTINGS

export function sortStarterTemplateExercises<T extends { position: number }>(
  exercises: readonly T[],
): T[] {
  return [...exercises].sort((a, b) => a.position - b.position)
}

export function starterTemplateExerciseNamesForPreview(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly ExerciseCatalogRow[],
): string[] {
  const catalogById = new Map(
    catalog.map((exercise) => [exercise.id, exercise]),
  )

  return sortStarterTemplateExercises(templateExercises)
    .map((row) => catalogById.get(row.exerciseId))
    .filter(
      (exercise): exercise is ExerciseCatalogRow =>
        exercise !== undefined && exercise.enabled,
    )
    .map((exercise) => exercise.displayName)
}

export function starterTemplateExercisesForEditor(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly Exercise[],
  generateId: () => string,
): StarterTemplateEditorExercise[] {
  const catalogById = new Map(
    catalog.map((exercise) => [exercise.id, exercise]),
  )

  return sortStarterTemplateExercises(templateExercises).flatMap((row) => {
    const exercise = catalogById.get(row.exerciseId)
    if (!exercise?.enabled) return []

    return [
      {
        id: generateId(),
        exerciseId: row.exerciseId,
        exercise,
        ...STANDARD_PROGRAM_EXERCISE_SETTINGS,
      },
    ]
  })
}

export function suggestedProgramNameFromTemplate(templateName: string): string {
  return templateName.trim()
}
