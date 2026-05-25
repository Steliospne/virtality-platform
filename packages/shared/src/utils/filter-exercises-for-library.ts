import { normalizeExerciseEquipmentKey } from './normalize-exercise-equipment-key.ts'

/** Minimal exercise row shape for library filtering (console list + tests). */
export type ExerciseLibraryFilterRow = {
  id: string
  name: string
  category: string
  item: string | null
  displayName: string
  direction: string
}

export function exerciseLibrarySearchText(row: ExerciseLibraryFilterRow): string {
  return `${row.displayName} ${row.direction}`.toLowerCase()
}

export type ExerciseLibraryFilterParams = {
  /** OR within dimension; empty means no body-part constraint. */
  selectedBodyParts: string[]
  /** OR within dimension; empty means no equipment constraint. Keys are normalized. */
  selectedEquipmentKeys: string[]
  searchTerm: string
  favoritesOnly: boolean
  /** Exercise IDs marked as favorites for the current user. */
  favoriteExerciseIds: Iterable<string>
}

/**
 * Client-side Exercise Library filtering: OR within body-part and equipment
 * dimensions, AND across dimensions, search, and favorites. Results are sorted
 * alphabetically by `name`.
 */
export function filterExercisesForLibrary<T extends ExerciseLibraryFilterRow>(
  exercises: T[],
  {
    selectedBodyParts,
    selectedEquipmentKeys,
    searchTerm,
    favoritesOnly,
    favoriteExerciseIds,
  }: ExerciseLibraryFilterParams,
): T[] {
  const favoriteSet =
    favoriteExerciseIds instanceof Set
      ? favoriteExerciseIds
      : new Set(favoriteExerciseIds)

  const search = searchTerm.trim().toLowerCase()

  const equipmentSelected = new Set(
    selectedEquipmentKeys.map((k) => normalizeExerciseEquipmentKey(k)),
  )

  let out = exercises

  if (selectedBodyParts.length > 0) {
    const body = new Set(selectedBodyParts)
    out = out.filter((e) => body.has(e.category))
  }

  if (selectedEquipmentKeys.length > 0) {
    out = out.filter((e) =>
      equipmentSelected.has(normalizeExerciseEquipmentKey(e.item)),
    )
  }

  if (favoritesOnly) {
    out = out.filter((e) => favoriteSet.has(e.id))
  }

  if (search !== '') {
    out = out.filter((e) => exerciseLibrarySearchText(e).includes(search))
  }

  return [...out].sort((a, b) => a.name.localeCompare(b.name))
}
