/**
 * Client-side deferred direction removal for the selected-program list (#21).
 * Markers are keyed by selected-row id (`CompleteExercise.id`), not catalog `exerciseId`.
 */

export type DeferredRemovalIdSet = ReadonlySet<string>

export function toDeferredRemovalIdSet(ids: readonly string[]): DeferredRemovalIdSet {
  return new Set(ids)
}

export function isDeferredRemoval(
  deferredRemovalIds: DeferredRemovalIdSet,
  rowId: string,
): boolean {
  return deferredRemovalIds.has(rowId)
}

export function markDeferredRemoval(
  deferredRemovalIds: DeferredRemovalIdSet,
  rowId: string,
): DeferredRemovalIdSet {
  const next = new Set(deferredRemovalIds)
  next.add(rowId)
  return next
}

export function unmarkDeferredRemoval(
  deferredRemovalIds: DeferredRemovalIdSet,
  rowId: string,
): DeferredRemovalIdSet {
  const next = new Set(deferredRemovalIds)
  next.delete(rowId)
  return next
}

/** Drop markers for rows no longer in the selected-program list. */
export function pruneDeferredRemovalIds(
  deferredRemovalIds: DeferredRemovalIdSet,
  existingRowIds: DeferredRemovalIdSet,
): string[] {
  return [...deferredRemovalIds].filter((id) => existingRowIds.has(id))
}

/** Rows eligible for Select all, segment checkboxes, and Remove Selected. */
export function bulkSelectableRowIds(
  rows: readonly { id: string }[],
  deferredRemovalIds: DeferredRemovalIdSet,
): string[] {
  return enabledMemberIds(
    rows.map((row) => row.id),
    deferredRemovalIds,
  )
}

export function enabledMemberIds(
  memberIds: readonly string[],
  deferredRemovalIds: DeferredRemovalIdSet,
): string[] {
  return memberIds.filter((id) => !isDeferredRemoval(deferredRemovalIds, id))
}

export function segmentMembersFullyDeferred(
  memberIds: readonly string[],
  deferredRemovalIds: DeferredRemovalIdSet,
): boolean {
  return (
    memberIds.length > 0 &&
    memberIds.every((id) => isDeferredRemoval(deferredRemovalIds, id))
  )
}

export function segmentCheckboxChecked(
  memberIds: readonly string[],
  selectedItems: readonly string[],
  deferredRemovalIds: DeferredRemovalIdSet,
): boolean | 'indeterminate' {
  const enabledIds = enabledMemberIds(memberIds, deferredRemovalIds)
  if (enabledIds.length === 0) return false

  const allSelected = enabledIds.every((id) => selectedItems.includes(id))
  const someSelected = enabledIds.some((id) => selectedItems.includes(id))

  if (allSelected) return true
  if (someSelected) return 'indeterminate'
  return false
}

export function isGlobalCheckSatisfied(
  rows: readonly { id: string }[],
  selectedItems: readonly string[],
  deferredRemovalIds: DeferredRemovalIdSet,
): boolean {
  const selectable = bulkSelectableRowIds(rows, deferredRemovalIds)
  return (
    selectable.length > 0 &&
    selectable.every((id) => selectedItems.includes(id))
  )
}
