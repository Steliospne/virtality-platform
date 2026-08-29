/**
 * Maps a nullable exercise `item` (equipment) to a canonical filter key used
 * by the exercise items API and client-side filtering. Null, undefined, and
 * blank values mean “no equipment” and are represented as `bodyweight`.
 */
export function exerciseEquipmentFilterKey(
  item: string | null | undefined,
): string {
  if (item == null) return 'bodyweight'
  const trimmed = item.trim()
  if (trimmed === '') return 'bodyweight'
  return trimmed.toLowerCase().replace(/\s+/g, '_')
}
