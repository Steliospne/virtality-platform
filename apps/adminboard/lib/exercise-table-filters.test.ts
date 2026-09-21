import { describe, expect, it } from 'vitest'
import {
  buildExerciseColumnFilters,
  countActiveExerciseFilters,
  EMPTY_EXERCISE_TABLE_FILTERS,
  exerciseValueFilterFn,
  listExerciseValues,
  toggleExerciseValue,
} from './exercise-table-filters'

describe('exercise table filters', () => {
  it('lists distinct trimmed values of a field, sorted', () => {
    expect(
      listExerciseValues(
        [
          { category: 'Strength' },
          { category: ' balance ' },
          { category: '' },
          { category: 'Strength' },
        ],
        'category',
      ),
    ).toEqual(['balance', 'Strength'])
    expect(
      listExerciseValues(
        [{ direction: 'Right' }, { direction: 'Left' }],
        'direction',
      ),
    ).toEqual(['Left', 'Right'])
  })

  it('emits only the active column filters', () => {
    expect(buildExerciseColumnFilters(EMPTY_EXERCISE_TABLE_FILTERS)).toEqual([])
    expect(
      buildExerciseColumnFilters({
        categories: ['Strength'],
        directions: ['Left'],
        onlyNew: true,
        onlyEnabled: false,
      }),
    ).toEqual([
      { id: 'category', value: ['Strength'] },
      { id: 'direction', value: ['Left'] },
      { id: 'isNew', value: true },
    ])
  })

  it('counts and toggles', () => {
    expect(
      countActiveExerciseFilters({
        categories: ['a', 'b'],
        directions: [],
        onlyNew: false,
        onlyEnabled: true,
      }),
    ).toBe(2)
    expect(toggleExerciseValue(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleExerciseValue(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('matches rows against the selected values', () => {
    const row = (value: string) =>
      ({ getValue: () => value }) as unknown as Parameters<
        typeof exerciseValueFilterFn
      >[0]

    expect(exerciseValueFilterFn(row('Strength'), 'category', [])).toBe(true)
    expect(
      exerciseValueFilterFn(row('Strength'), 'category', ['Strength']),
    ).toBe(true)
    expect(
      exerciseValueFilterFn(row('Balance'), 'category', ['Strength']),
    ).toBe(false)
  })
})
