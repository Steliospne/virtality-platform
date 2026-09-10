import { describe, expect, it } from 'vitest'
import {
  PROGRAM_RETIRE_CONFIRMATION,
  filterProgramsBySearch,
  getProgramExerciseCount,
} from './program-library.js'

const samplePrograms = [
  {
    id: 'program-1',
    name: 'Shoulder rehab',
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    exercises: [{ id: 'row-1' }, { id: 'row-2' }],
  },
  {
    id: 'program-2',
    name: 'Wrist mobility',
    updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    exercises: [{ id: 'row-3' }],
  },
  {
    id: 'program-3',
    name: 'Shoulder strength',
    updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    exercises: [],
  },
]

describe('program library list metadata', () => {
  it('counts exercises for each reusable program row', () => {
    expect(getProgramExerciseCount(samplePrograms[0]!)).toBe(2)
    expect(getProgramExerciseCount(samplePrograms[2]!)).toBe(0)
  })
})

describe('program library search', () => {
  it('returns all programs when the search query is empty', () => {
    expect(filterProgramsBySearch(samplePrograms, '')).toEqual(samplePrograms)
    expect(filterProgramsBySearch(samplePrograms, '   ')).toEqual(
      samplePrograms,
    )
  })

  it('filters programs by name without requiring unique names', () => {
    expect(filterProgramsBySearch(samplePrograms, 'shoulder')).toEqual([
      samplePrograms[0],
      samplePrograms[2],
    ])
  })

  it('matches search queries case-insensitively', () => {
    expect(filterProgramsBySearch(samplePrograms, 'WRIST')).toEqual([
      samplePrograms[1],
    ])
  })
})

describe('program library delete confirmation', () => {
  it('uses delete wording while explaining soft retirement', () => {
    const { menuLabel, title, confirmLabel, description } =
      PROGRAM_RETIRE_CONFIRMATION

    expect(menuLabel).toBe('Delete')
    expect(title).toBe('Delete program?')
    expect(confirmLabel).toBe(title.replace('?', ''))
    expect(description).toMatch(/past patient sessions/i)
    expect(description).toMatch(/unchanged/i)
    expect(description).toMatch(/no longer appear for future treatment/i)
  })
})
