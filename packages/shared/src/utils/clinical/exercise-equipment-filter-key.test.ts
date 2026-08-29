import { describe, expect, it } from 'vitest'
import { exerciseEquipmentFilterKey } from './exercise-equipment-filter-key.ts'

describe('exerciseEquipmentFilterKey', () => {
  it('maps null, undefined, and blank strings to bodyweight', () => {
    expect(exerciseEquipmentFilterKey(null)).toBe('bodyweight')
    expect(exerciseEquipmentFilterKey(undefined)).toBe('bodyweight')
    expect(exerciseEquipmentFilterKey('')).toBe('bodyweight')
    expect(exerciseEquipmentFilterKey('   ')).toBe('bodyweight')
  })

  it('lowercases and turns inner whitespace into underscores', () => {
    expect(exerciseEquipmentFilterKey('Dumbbell')).toBe('dumbbell')
    expect(exerciseEquipmentFilterKey('Resistance Band')).toBe(
      'resistance_band',
    )
  })

  it('preserves existing underscores after normalization', () => {
    expect(exerciseEquipmentFilterKey('resistance_band')).toBe(
      'resistance_band',
    )
  })
})
