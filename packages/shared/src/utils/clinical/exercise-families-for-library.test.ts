import { describe, expect, it } from 'vitest'
import {
  familyMemberForNearTermDirection,
  familyMembersForLibrarySelection,
  filterExerciseFamiliesForLibrary,
  groupExercisesIntoFamiliesByDisplayName,
  libraryFamilySelectionState,
  parseNearTermDirection,
} from './exercise-families-for-library.ts'
import type { ExerciseLibraryFilterRow } from './filter-exercises-for-library.ts'

function ex(
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

const noFav = { favoritesOnly: false, favoriteExerciseIds: [] as string[] }

describe('parseNearTermDirection', () => {
  it('maps left and right case-insensitively', () => {
    expect(parseNearTermDirection('Left')).toBe('Left')
    expect(parseNearTermDirection('RIGHT')).toBe('Right')
    expect(parseNearTermDirection(' Bilateral ')).toBeNull()
  })
})

describe('familyMemberForNearTermDirection', () => {
  it('returns the member matching a near-term side', () => {
    const rows = [
      ex({
        id: 'pl',
        name: 'press left',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Left',
      }),
      ex({
        id: 'pr',
        name: 'press right',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Right',
      }),
    ]
    const [family] = groupExercisesIntoFamiliesByDisplayName(rows)
    expect(familyMemberForNearTermDirection(family!, 'Left')?.id).toBe('pl')
    expect(familyMemberForNearTermDirection(family!, 'Right')?.id).toBe('pr')
  })
})

describe('libraryFamilySelectionState', () => {
  it('reports partial when only one bilateral variant is selected', () => {
    expect(
      libraryFamilySelectionState([{ id: 'pl' }, { id: 'pr' }], {
        pl: true,
        pr: false,
      }),
    ).toBe('partial')
  })
})

describe('familyMembersForLibrarySelection', () => {
  it('returns only Left/Right members when family is bilateral', () => {
    const rows = [
      ex({
        id: 'pl',
        name: 'press left',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Left',
      }),
      ex({
        id: 'pr',
        name: 'press right',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Right',
      }),
      ex({
        id: 'pb',
        name: 'press bilateral',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Bilateral',
      }),
    ]
    const [family] = groupExercisesIntoFamiliesByDisplayName(rows)
    expect(family).toBeDefined()
    const sel = familyMembersForLibrarySelection(family!)
    expect(sel.map((m) => m.id).sort()).toEqual(['pl', 'pr'])
  })

  it('returns all members when family is not bilateral', () => {
    const rows = [
      ex({
        id: 'only',
        name: 'curl',
        category: 'wrist',
        displayName: 'Curl',
        direction: 'Left',
      }),
      ex({
        id: 'other',
        name: 'curl alt',
        category: 'wrist',
        displayName: 'Curl',
        direction: 'Bilateral',
      }),
    ]
    const [family] = groupExercisesIntoFamiliesByDisplayName(rows)
    expect(family).toBeDefined()
    const sel = familyMembersForLibrarySelection(family!)
    expect(sel.map((m) => m.id).sort()).toEqual(['only', 'other'])
  })
})

describe('groupExercisesIntoFamiliesByDisplayName', () => {
  it('merges left/right variants into one family', () => {
    const rows = [
      ex({
        id: 'a',
        name: 'z press',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Right',
      }),
      ex({
        id: 'b',
        name: 'a press',
        category: 'shoulder',
        displayName: 'Press',
        direction: 'Left',
      }),
    ]
    const families = groupExercisesIntoFamiliesByDisplayName(rows)
    expect(families).toHaveLength(1)
    expect(families[0]!.familyKey).toBe('Press')
    expect(families[0]!.members.map((m) => m.id)).toEqual(['b', 'a'])
    expect(families[0]!.availableDirections).toEqual(['Left', 'Right'])
    expect(families[0]!.representative.id).toBe('b')
  })
})

describe('filterExerciseFamiliesForLibrary', () => {
  const catalog: ExerciseLibraryFilterRow[] = [
    ex({
      id: 'pl',
      name: 'press left',
      category: 'shoulder',
      item: null,
      displayName: 'Press',
      direction: 'Left',
    }),
    ex({
      id: 'pr',
      name: 'press right',
      category: 'shoulder',
      item: null,
      displayName: 'Press',
      direction: 'Right',
    }),
    ex({
      id: 'curl',
      name: 'curl',
      category: 'wrist',
      item: 'dumbbell',
      displayName: 'Curl',
      direction: 'Left',
    }),
  ]

  it('returns one family for bilateral displayName', () => {
    const r = filterExerciseFamiliesForLibrary(catalog, {
      selectedBodyParts: [],
      selectedEquipmentKeys: [],
      searchTerm: '',
      ...noFav,
    })
    const keys = r.map((f) => f.familyKey).sort()
    expect(keys).toEqual(['Curl', 'Press'])
  })

  it('keeps bilateral family when search matches only one side', () => {
    const r = filterExerciseFamiliesForLibrary(catalog, {
      selectedBodyParts: [],
      selectedEquipmentKeys: [],
      searchTerm: 'right',
      ...noFav,
    })
    expect(r).toHaveLength(1)
    expect(r[0]!.familyKey).toBe('Press')
    expect(r[0]!.members.map((m) => m.id).sort()).toEqual(['pl', 'pr'])
    expect(r[0]!.directionBadges).toEqual([
      { side: 'Left', emphasized: false },
      { side: 'Right', emphasized: true },
    ])
  })

  it('does not treat substring right inside unrelated words as a side term', () => {
    const rows: ExerciseLibraryFilterRow[] = [
      ex({
        id: 'x',
        name: 'bright spot',
        category: 'shoulder',
        displayName: 'Bright',
        direction: 'Left',
      }),
    ]
    const r = filterExerciseFamiliesForLibrary(rows, {
      selectedBodyParts: [],
      selectedEquipmentKeys: [],
      searchTerm: 'bright',
      ...noFav,
    })
    expect(r).toHaveLength(1)
    expect(r[0]!.directionBadges.every((b) => !b.emphasized)).toBe(true)
  })

  it('ORs body parts across members', () => {
    const rows: ExerciseLibraryFilterRow[] = [
      ex({
        id: 'l',
        name: 'a',
        category: 'wrist',
        displayName: 'Combo',
        direction: 'Left',
      }),
      ex({
        id: 'r',
        name: 'b',
        category: 'shoulder',
        displayName: 'Combo',
        direction: 'Right',
      }),
    ]
    const shoulderOnly = filterExerciseFamiliesForLibrary(rows, {
      selectedBodyParts: ['shoulder'],
      selectedEquipmentKeys: [],
      searchTerm: '',
      ...noFav,
    })
    expect(shoulderOnly).toHaveLength(1)
    expect(shoulderOnly[0]!.members.map((m) => m.id).sort()).toEqual(['l', 'r'])
  })

  it('respects favorites when any member is starred', () => {
    const r = filterExerciseFamiliesForLibrary(catalog, {
      selectedBodyParts: [],
      selectedEquipmentKeys: [],
      searchTerm: '',
      favoritesOnly: true,
      favoriteExerciseIds: ['pl'],
    })
    expect(r.map((f) => f.familyKey)).toEqual(['Press'])
  })
})
