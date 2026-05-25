import { exerciseEquipmentFilterKey } from '@virtality/shared/utils'

type WithNullableItem = { item: string | null }

/**
 * Equipment filter: OR within selection. Empty selection shows all exercises.
 * Uses the same item → filter-key mapping as `GET /exercise/items`.
 */
export function filterExercisesByEquipment<T extends WithNullableItem>(
  exercises: T[],
  selectedEquipmentKeys: string[],
): T[] {
  if (selectedEquipmentKeys.length === 0) return exercises
  const set = new Set(selectedEquipmentKeys)
  return exercises.filter((e) =>
    set.has(exerciseEquipmentFilterKey(e.item)),
  )
}

/** Human-readable label for an equipment filter chip. */
export function formatExerciseEquipmentChipLabel(key: string): string {
  return key
    .split('_')
    .map((segment) => {
      if (segment.length === 0) return ''
      return (
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
      )
    })
    .join(' ')
}
