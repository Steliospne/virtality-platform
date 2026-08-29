import { parseNearTermDirection } from './exercise-families-for-library.ts'

/** Row shape needed to detect adjacent Left/Right pairs for the same family (`displayName`). */
export type ProgramExerciseListSegmentRow = {
  displayName: string
  direction: string
}

export type ProgramExerciseListSegment =
  | { kind: 'single'; startIndex: number }
  | { kind: 'bilateral'; startIndex: number }

/**
 * Partition a program exercise list into single rows vs adjacent bilateral pairs
 * (same `displayName`, one Left and one Right in the near-term direction set).
 * Used for compact grouped authoring UI (PRD #5, GitHub #8).
 */
export function segmentProgramExerciseRowsByAdjacentBilateralFamilies<
  T extends ProgramExerciseListSegmentRow,
>(rows: readonly T[]): ProgramExerciseListSegment[] {
  const out: ProgramExerciseListSegment[] = []
  let i = 0
  while (i < rows.length) {
    const a = rows[i]!
    const b = rows[i + 1]
    if (b && isAdjacentBilateralPair(a, b)) {
      out.push({ kind: 'bilateral', startIndex: i })
      i += 2
    } else {
      out.push({ kind: 'single', startIndex: i })
      i += 1
    }
  }
  return out
}

function isAdjacentBilateralPair(
  a: ProgramExerciseListSegmentRow,
  b: ProgramExerciseListSegmentRow,
): boolean {
  if (!a.displayName || a.displayName !== b.displayName) return false
  const da = parseNearTermDirection(a.direction)
  const db = parseNearTermDirection(b.direction)
  if (!da || !db || da === db) return false
  return true
}
