/**
 * Maps nullable exercise `item` values to a canonical equipment filter key.
 * Null, undefined, and whitespace-only strings are treated as bodyweight.
 */
export function normalizeExerciseEquipmentKey(
  item: string | null | undefined,
): string {
  if (item == null) return 'bodyweight'
  const trimmed = item.trim()
  if (trimmed === '') return 'bodyweight'
  return trimmed.toLowerCase()
}
