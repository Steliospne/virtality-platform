import type { CompleteExercise } from '@/types/models'
import { parseNearTermDirection, type NearTermDirection } from '@virtality/shared/utils'

/**
 * Insert a missing near-term sibling so Left/Right variants stay adjacent for
 * grouped bilateral rows (PRD #5, GitHub #13).
 */
export function insertBilateralSiblingRow(
  exercises: readonly CompleteExercise[],
  anchorIndex: number,
  side: NearTermDirection,
  newRow: CompleteExercise,
): CompleteExercise[] {
  const anchorDir = parseNearTermDirection(
    exercises[anchorIndex]?.exercise?.direction ?? '',
  )
  const next = [...exercises]
  if (side === 'Right' && anchorDir === 'Left') {
    next.splice(anchorIndex + 1, 0, newRow)
    return next
  }
  if (side === 'Left' && anchorDir === 'Right') {
    next.splice(anchorIndex, 0, newRow)
    return next
  }
  return [...next, newRow]
}
