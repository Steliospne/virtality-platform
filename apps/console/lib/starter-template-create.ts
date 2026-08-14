import type { Exercise } from '@virtality/db'
import {
  familyMembersForLibrarySelection,
  groupExercisesIntoFamiliesByDisplayName,
  type ExerciseFamilyForLibrary,
  type ExerciseLibraryFilterRow,
} from '@virtality/shared/utils'

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

export type StarterTemplatePreviewExercise = Pick<
  Exercise,
  'id' | 'displayName' | 'direction' | 'enabled' | 'image' | 'video'
>

export type StarterTemplateEditorExercise = {
  id: string
  exerciseId: string
  exercise: Exercise
} & typeof STANDARD_PROGRAM_EXERCISE_SETTINGS

export type StarterTemplateCatalogSelection = {
  /** Program Exercise rows seeded for settings-first authoring. */
  selectedExercises: StarterTemplateEditorExercise[]
  /** Catalog variant selection keyed by Exercise Variant id (`exerciseId`). */
  isSelected: Record<string, boolean>
}

type StarterTemplateFamilyCatalogExercise = {
  id: string
  displayName: string
  direction: string
  enabled: boolean
}

export function sortStarterTemplateExercises<T extends { position: number }>(
  exercises: readonly T[],
): T[] {
  return [...exercises].sort((a, b) => a.position - b.position)
}

function catalogExercisesById<T extends { id: string }>(
  catalog: readonly T[],
): Map<string, T> {
  return new Map(catalog.map((exercise) => [exercise.id, exercise]))
}

function toExerciseLibraryRow<
  T extends Pick<
    StarterTemplateFamilyCatalogExercise,
    'id' | 'displayName' | 'direction'
  >,
>(exercise: T): ExerciseLibraryFilterRow {
  return {
    id: exercise.id,
    name: exercise.id,
    category: '',
    displayName: exercise.displayName,
    direction: exercise.direction,
    item: null,
  }
}

function familiesByDisplayNameFromCatalog<
  T extends StarterTemplateFamilyCatalogExercise,
>(catalog: readonly T[]) {
  const families = groupExercisesIntoFamiliesByDisplayName(
    catalog.map(toExerciseLibraryRow),
  )

  return new Map(families.map((family) => [family.familyKey, family]))
}

function resolveStarterTemplateCatalogExercises<
  T extends { id: string; enabled: boolean },
>(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly T[],
): T[] {
  const catalogById = catalogExercisesById(catalog)

  return sortStarterTemplateExercises(templateExercises)
    .map((row) => catalogById.get(row.exerciseId))
    .filter(
      (exercise): exercise is T => exercise !== undefined && exercise.enabled,
    )
}

function keepFirstExercisePerFamilyKey<T extends { displayName: string }>(
  exercises: readonly T[],
): T[] {
  const seenFamilyKeys = new Set<string>()

  return exercises.filter((exercise) => {
    const familyKey = exercise.displayName
    if (seenFamilyKeys.has(familyKey)) return false
    seenFamilyKeys.add(familyKey)
    return true
  })
}

function resolveUniqueFamiliesForPreview<
  T extends StarterTemplateFamilyCatalogExercise,
>(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly T[],
): T[] {
  return keepFirstExercisePerFamilyKey(
    resolveStarterTemplateCatalogExercises(templateExercises, catalog),
  )
}

function appendStarterTemplateFamilySelection<
  T extends StarterTemplateFamilyCatalogExercise,
>(
  expanded: T[],
  catalogById: Map<string, T>,
  exercise: T,
  family: ExerciseFamilyForLibrary<ExerciseLibraryFilterRow> | undefined,
): void {
  if (!family) {
    expanded.push(exercise)
    return
  }

  for (const member of familyMembersForLibrarySelection(family)) {
    const catalogExercise = catalogById.get(member.id)
    if (catalogExercise?.enabled) {
      expanded.push(catalogExercise)
    }
  }
}

function expandStarterTemplateFamiliesInCatalog<
  T extends StarterTemplateFamilyCatalogExercise,
>(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly T[],
): T[] {
  const catalogById = catalogExercisesById(catalog)
  const familyByKey = familiesByDisplayNameFromCatalog(
    catalog.filter((exercise) => exercise.enabled),
  )

  const expanded: T[] = []
  const seenFamilyKeys = new Set<string>()

  for (const row of sortStarterTemplateExercises(templateExercises)) {
    const exercise = catalogById.get(row.exerciseId)
    if (!exercise?.enabled) continue

    const familyKey = exercise.displayName
    if (seenFamilyKeys.has(familyKey)) continue
    seenFamilyKeys.add(familyKey)

    appendStarterTemplateFamilySelection(
      expanded,
      catalogById,
      exercise,
      familyByKey.get(familyKey),
    )
  }

  return expanded
}

export function starterTemplateExercisesForPreview(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly StarterTemplatePreviewExercise[],
): StarterTemplatePreviewExercise[] {
  return resolveUniqueFamiliesForPreview(templateExercises, catalog)
}

export function starterTemplateExerciseNamesForPreview(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly ExerciseCatalogRow[],
): string[] {
  return resolveUniqueFamiliesForPreview(templateExercises, catalog).map(
    (exercise) => exercise.displayName,
  )
}

function variantSelectionFromEditorExercises(
  selectedExercises: readonly StarterTemplateEditorExercise[],
): StarterTemplateCatalogSelection['isSelected'] {
  return Object.fromEntries(
    selectedExercises.map((row) => [row.exerciseId, true]),
  )
}

export function starterTemplateExercisesForEditor(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly Exercise[],
  generateId: () => string,
): StarterTemplateEditorExercise[] {
  return expandStarterTemplateFamiliesInCatalog(templateExercises, catalog).map(
    (exercise) => ({
      id: generateId(),
      exerciseId: exercise.id,
      exercise,
      ...STANDARD_PROGRAM_EXERCISE_SETTINGS,
    }),
  )
}

export function starterTemplateCatalogSelection(
  templateExercises: readonly StarterTemplateExerciseRow[],
  catalog: readonly Exercise[],
  generateId: () => string,
): StarterTemplateCatalogSelection {
  const selectedExercises = starterTemplateExercisesForEditor(
    templateExercises,
    catalog,
    generateId,
  )

  return {
    selectedExercises,
    isSelected: variantSelectionFromEditorExercises(selectedExercises),
  }
}

export function suggestedProgramNameFromTemplate(templateName: string): string {
  return templateName.trim()
}
