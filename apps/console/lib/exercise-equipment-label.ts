/** Human-readable label for an equipment filter chip (e.g. `resistance_band` → `Resistance Band`). */
export function formatExerciseEquipmentChipLabel(key: string): string {
  return key
    .split('_')
    .map(
      (part) =>
        part.length === 0
          ? part
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(' ')
}
