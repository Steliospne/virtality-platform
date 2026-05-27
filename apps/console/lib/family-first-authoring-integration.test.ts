import { describe, expect, it } from 'vitest'
import {
  familyMemberForNearTermDirection,
  familyMembersForLibrarySelection,
  groupExercisesIntoFamiliesByDisplayName,
  libraryFamilySelectionState,
  segmentProgramExerciseRowsByAdjacentBilateralFamilies,
} from '@virtality/shared/utils'
import type { ExerciseLibraryFilterRow } from '@virtality/shared/utils'
import type { CompleteExercise } from '@/types/models'

function libRow(
  partial: Partial<ExerciseLibraryFilterRow> &
    Pick<ExerciseLibraryFilterRow, 'id' | 'name' | 'category'>,
): ExerciseLibraryFilterRow {
  return {
    item: null,
    displayName: partial.displayName ?? partial.name,
    direction: partial.direction ?? 'Left',
    ...partial,
  }
}

function programRow(exerciseId: string, displayName: string, direction: string) {
  return {
    id: `row-${exerciseId}`,
    exerciseId,
    reps: 10,
    sets: 3,
    restTime: 5,
    holdTime: 1,
    speed: 1,
    romMode: 0 as const,
    exercise: { displayName, direction } as CompleteExercise['exercise'],
  } satisfies CompleteExercise
}

describe('family-first authoring integration', () => {
  it('aligns dual-side library selection with compact bilateral program rows', () => {
    const catalog = [
      libRow({
        id: 'pl',
        name: 'p-l',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Left',
      }),
      libRow({
        id: 'pr',
        name: 'p-r',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Right',
      }),
    ]
    const [fam] = groupExercisesIntoFamiliesByDisplayName(catalog)
    expect(fam).toBeDefined()
    const selectable = familyMembersForLibrarySelection(fam!)
    expect(selectable.map((m) => m.id).sort()).toEqual(['pl', 'pr'])

    const programList = [programRow('pl', 'Press', 'Left'), programRow('pr', 'Press', 'Right')]
    const segs = segmentProgramExerciseRowsByAdjacentBilateralFamilies(
      programList.map((p) => ({
        displayName: p.exercise?.displayName ?? '',
        direction: p.exercise?.direction ?? '',
      })),
    )
    expect(segs).toEqual([{ kind: 'bilateral', startIndex: 0 }])
  })

  it('supports selecting a single near-term direction before submit', () => {
    const catalog = [
      libRow({
        id: 'pl',
        name: 'p-l',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Left',
      }),
      libRow({
        id: 'pr',
        name: 'p-r',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Right',
      }),
    ]
    const [fam] = groupExercisesIntoFamiliesByDisplayName(catalog)
    const leftOnly = familyMemberForNearTermDirection(fam!, 'Left')!
    expect(leftOnly.id).toBe('pl')
    expect(
      libraryFamilySelectionState(
        familyMembersForLibrarySelection(fam!),
        { pl: true, pr: false },
      ),
    ).toBe('partial')
  })
})
