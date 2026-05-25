/**
 * Maps nullable exercise `item` values to a canonical equipment filter key.
 * Null, undefined, and empty strings are treated as bodyweight (equipment-free).
 */
export function normalizeExerciseEquipmentItem(
  item: string | null | undefined,
): string {
  if (item == null) return 'bodyweight'
  const trimmed = item.trim()
  return trimmed === '' ? 'bodyweight' : trimmed
}
