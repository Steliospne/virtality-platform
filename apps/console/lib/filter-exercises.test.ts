import { describe, expect, it } from 'vitest'
import { filterExercises, type ExerciseFilterable } from './filter-exercises'

const base = (over: Partial<ExerciseFilterable>): ExerciseFilterable => ({
  id: 'id',
  name: 'name',
  category: 'shoulder',
  item: null,
  displayName: 'Display',
  direction: 'Left',
  ...over,
})

describe('filterExercises', () => {
  it('returns all exercises sorted by name when no filters', () => {
    const exercises = [
      base({ id: 'b', name: 'B', category: 'wrist' }),
      base({ id: 'a', name: 'A', category: 'shoulder' }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: [],
      selectedEquipment: [],
      searchTerm: '',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(out.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('filters by single body part', () => {
    const exercises = [
      base({ id: '1', name: 'S', category: 'shoulder' }),
      base({ id: '2', name: 'W', category: 'wrist' }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: ['wrist'],
      selectedEquipment: [],
      searchTerm: '',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(out.map((e) => e.id)).toEqual(['2'])
  })

  it('ORs multiple body parts', () => {
    const exercises = [
      base({ id: '1', name: 'A', category: 'shoulder' }),
      base({ id: '2', name: 'B', category: 'wrist' }),
      base({ id: '3', name: 'C', category: 'forearm' }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: ['shoulder', 'wrist'],
      selectedEquipment: [],
      searchTerm: '',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(out.map((e) => e.id)).toEqual(['1', '2'])
  })

  it('matches bodyweight chip to null or empty item only', () => {
    const exercises = [
      base({ id: 'bw', name: 'BW', item: null }),
      base({ id: 'emp', name: 'Emp', item: '   ' }),
      base({ id: 'db', name: 'Db', item: 'dumbbell' }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: [],
      selectedEquipment: ['bodyweight'],
      searchTerm: '',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(new Set(out.map((e) => e.id))).toEqual(new Set(['bw', 'emp']))
  })

  it('ORs multiple equipment selections', () => {
    const exercises = [
      base({ id: '1', name: 'A', item: 'dumbbell' }),
      base({ id: '2', name: 'B', item: 'resistance_band' }),
      base({ id: '3', name: 'C', item: null }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: [],
      selectedEquipment: ['dumbbell', 'resistance_band'],
      searchTerm: '',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(out.map((e) => e.id)).toEqual(['1', '2'])
  })

  it('ANDs body part and equipment', () => {
    const exercises = [
      base({
        id: 'ok',
        name: 'Ok',
        category: 'shoulder',
        item: 'dumbbell',
      }),
      base({
        id: 'wrong-cat',
        name: 'X',
        category: 'wrist',
        item: 'dumbbell',
      }),
      base({
        id: 'wrong-item',
        name: 'Y',
        category: 'shoulder',
        item: 'resistance_band',
      }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: ['shoulder'],
      selectedEquipment: ['dumbbell'],
      searchTerm: '',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(out.map((e) => e.id)).toEqual(['ok'])
  })

  it('narrows further with case-insensitive search on display label', () => {
    const exercises = [
      base({
        id: '1',
        name: 'A',
        displayName: 'Press',
        direction: 'Left',
      }),
      base({
        id: '2',
        name: 'B',
        displayName: 'Raise',
        direction: 'Right',
      }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: [],
      selectedEquipment: [],
      searchTerm: 'press',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(out.map((e) => e.id)).toEqual(['1'])
  })

  it('restricts to favorites when toggle on', () => {
    const exercises = [
      base({ id: 'fav', name: 'A' }),
      base({ id: 'other', name: 'B' }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: [],
      selectedEquipment: [],
      searchTerm: '',
      favoritesOnly: true,
      favoriteExerciseIds: ['fav'],
    })
    expect(out.map((e) => e.id)).toEqual(['fav'])
  })

  it('ANDs favorites with other filters', () => {
    const exercises = [
      base({
        id: 'ok',
        name: 'A',
        category: 'shoulder',
        item: 'dumbbell',
      }),
      base({
        id: 'not-fav',
        name: 'B',
        category: 'shoulder',
        item: 'dumbbell',
      }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: ['shoulder'],
      selectedEquipment: ['dumbbell'],
      searchTerm: '',
      favoritesOnly: true,
      favoriteExerciseIds: ['ok'],
    })
    expect(out.map((e) => e.id)).toEqual(['ok'])
  })

  it('returns empty when over-constrained', () => {
    const exercises = [base({ id: '1', name: 'A', category: 'shoulder' })]
    const out = filterExercises(exercises, {
      selectedBodyParts: ['wrist'],
      selectedEquipment: [],
      searchTerm: '',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(out).toEqual([])
  })

  it('preserves alphabetical sort within filtered set', () => {
    const exercises = [
      base({ id: '1', name: 'Zed', category: 'shoulder' }),
      base({ id: '2', name: 'Alpha', category: 'shoulder' }),
    ]
    const out = filterExercises(exercises, {
      selectedBodyParts: ['shoulder'],
      selectedEquipment: [],
      searchTerm: '',
      favoritesOnly: false,
      favoriteExerciseIds: [],
    })
    expect(out.map((e) => e.name)).toEqual(['Alpha', 'Zed'])
  })
})
