import { normalizeExerciseEquipmentKey } from '@virtality/shared/utils'

/** Fields required for client-side exercise library filtering. */
export type ExerciseFilterable = {
  id: string
  name: string
  category: string
  item: string | null | undefined
  displayName: string
  direction: string
}

export type FilterExercisesParams = {
  selectedBodyParts: string[]
  selectedEquipment: string[]
  searchTerm: string
  favoritesOnly: boolean
  /** Exercise IDs the user has starred. */
  favoriteExerciseIds: readonly string[]
}

function exerciseDisplayLabel(e: ExerciseFilterable): string {
  return `${e.displayName} ${e.direction}`
}

/**
 * Pure filter for the exercise library grid.
 * OR within body-part and equipment dimensions; AND across dimensions, search, and favorites.
 * Results are sorted alphabetically by `name`.
 */
export function filterExercises<T extends ExerciseFilterable>(
  exercises: readonly T[],
  params: FilterExercisesParams,
): T[] {
  const search = params.searchTerm.trim().toLowerCase()
  const favoriteSet = new Set(params.favoriteExerciseIds)

  let out: T[] = [...exercises]

  if (params.selectedBodyParts.length > 0) {
    const body = new Set(params.selectedBodyParts)
    out = out.filter((e) => body.has(e.category))
  }

  if (params.selectedEquipment.length > 0) {
    const equip = new Set(params.selectedEquipment)
    out = out.filter((e) => equip.has(normalizeExerciseEquipmentKey(e.item)))
  }

  if (search.length > 0) {
    out = out.filter((e) =>
      exerciseDisplayLabel(e).toLowerCase().includes(search),
    )
  }

  if (params.favoritesOnly) {
    out = out.filter((e) => favoriteSet.has(e.id))
  }

  return [...out].sort((a, b) => a.name.localeCompare(b.name))
}
