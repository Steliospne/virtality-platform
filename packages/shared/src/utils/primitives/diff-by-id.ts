/**
 * Partitions two arrays of items with `id` into toDelete, toCreate, and toUpdate.
 * - toDelete: items in prev that are not in next
 * - toCreate: items in next that are not in prev
 * - toUpdate: items in next that exist in prev (by id)
 */
export function diffById<T extends { id: string }>(
  prev: T[],
  next: T[],
): { toDelete: T[]; toCreate: T[]; toUpdate: T[] } {
  const toDelete = prev.filter((pe) => !next.some((ex) => ex.id === pe.id))
  const toCreate = next.filter((ex) => !prev.some((pe) => pe.id === ex.id))
  const toUpdate = next.filter((ex) => prev.some((pe) => pe.id === ex.id))
  return { toDelete, toCreate, toUpdate }
}
