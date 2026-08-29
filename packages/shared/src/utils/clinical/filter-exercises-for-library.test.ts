import { describe, expect, it } from 'vitest'
import {
  filterExercisesForLibrary,
  type ExerciseLibraryFilterRow,
} from './filter-exercises-for-library.ts'
import { normalizeExerciseEquipmentKey } from './normalize-exercise-equipment-key.ts'

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

describe('normalizeExerciseEquipmentKey', () => {
  it('maps null, undefined, and blank to bodyweight', () => {
    expect(normalizeExerciseEquipmentKey(null)).toBe('bodyweight')
    expect(normalizeExerciseEquipmentKey(undefined)).toBe('bodyweight')
    expect(normalizeExerciseEquipmentKey('')).toBe('bodyweight')
    expect(normalizeExerciseEquipmentKey('  ')).toBe('bodyweight')
  })

  it('lowercases non-empty values', () => {
    expect(normalizeExerciseEquipmentKey('Dumbbell')).toBe('dumbbell')
  })
})

describe('filterExercisesForLibrary', () => {
  const rows: ExerciseLibraryFilterRow[] = [
    ex({
      id: '1',
      name: 'shoulder press',
      category: 'shoulder',
      item: null,
      displayName: 'Press',
      direction: 'Left',
    }),
    ex({
      id: '2',
      name: 'curl',
      category: 'wrist',
      item: 'dumbbell',
      displayName: 'Wrist Curl',
      direction: 'Right',
    }),
    ex({
      id: '3',
      name: 'band pull',
      category: 'shoulder',
      item: 'resistance_band',
      displayName: 'Band Pull',
      direction: 'Left',
    }),
  ]

  const noFav = { favoritesOnly: false, favoriteExerciseIds: [] as string[] }

  it('returns all exercises when no dimension filters are set', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: [],
      selectedEquipmentKeys: [],
      searchTerm: '',
      ...noFav,
    })
    expect(r.map((e) => e.id).sort()).toEqual(['1', '2', '3'])
  })

  it('filters by a single body part', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: ['wrist'],
      selectedEquipmentKeys: [],
      searchTerm: '',
      ...noFav,
    })
    expect(r.map((e) => e.id)).toEqual(['2'])
  })

  it('ORs multiple body parts', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: ['wrist', 'shoulder'],
      selectedEquipmentKeys: [],
      searchTerm: '',
      ...noFav,
    })
    expect(r.map((e) => e.id).sort()).toEqual(['1', '2', '3'])
  })

  it('filters by a single equipment key', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: [],
      selectedEquipmentKeys: ['dumbbell'],
      searchTerm: '',
      ...noFav,
    })
    expect(r.map((e) => e.id)).toEqual(['2'])
  })

  it('treats null item as bodyweight for equipment matching', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: [],
      selectedEquipmentKeys: ['bodyweight'],
      searchTerm: '',
      ...noFav,
    })
    expect(r.map((e) => e.id)).toEqual(['1'])
  })

  it('ANDs body part with equipment', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: ['shoulder'],
      selectedEquipmentKeys: ['resistance_band'],
      searchTerm: '',
      ...noFav,
    })
    expect(r.map((e) => e.id)).toEqual(['3'])
  })

  it('narrows further with search on display name + direction', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: ['shoulder'],
      selectedEquipmentKeys: [],
      searchTerm: 'press',
      ...noFav,
    })
    expect(r.map((e) => e.id)).toEqual(['1'])
  })

  it('restricts to favorites when toggled', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: [],
      selectedEquipmentKeys: [],
      searchTerm: '',
      favoritesOnly: true,
      favoriteExerciseIds: ['2', '3'],
    })
    expect(r.map((e) => e.id).sort()).toEqual(['2', '3'])
  })

  it('returns empty when over-constrained', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: ['wrist'],
      selectedEquipmentKeys: ['resistance_band'],
      searchTerm: '',
      ...noFav,
    })
    expect(r).toEqual([])
  })

  it('sorts alphabetically by name', () => {
    const r = filterExercisesForLibrary(rows, {
      selectedBodyParts: [],
      selectedEquipmentKeys: [],
      searchTerm: '',
      ...noFav,
    })
    expect(r.map((e) => e.name)).toEqual([
      'band pull',
      'curl',
      'shoulder press',
    ])
  })
})
