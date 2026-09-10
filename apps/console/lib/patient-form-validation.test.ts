import { describe, expect, it } from 'vitest'
import { PatientFormSchema } from './definitions'
import { patientSexSelectValue } from './patient-form-validation'

const validBase = {
  name: 'Test Patient',
  email: '',
  anamneses: null,
  complaints: null,
  expectations: null,
  diagnosis: null,
  nprs: null,
}

describe('PatientFormSchema sex and language', () => {
  it('rejects submit when sex is missing', () => {
    const result = PatientFormSchema.safeParse({
      ...validBase,
      sex: '',
      language: 'English',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'sex')).toBe(
        true,
      )
    }
  })

  it('rejects legacy other sex on save', () => {
    const result = PatientFormSchema.safeParse({
      ...validBase,
      sex: 'other',
      language: 'English',
    })
    expect(result.success).toBe(false)
  })

  it('rejects submit when language is missing', () => {
    const result = PatientFormSchema.safeParse({
      ...validBase,
      sex: 'male',
      language: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === 'language'),
      ).toBe(true)
    }
  })

  it('accepts male or female with a chosen language', () => {
    expect(
      PatientFormSchema.safeParse({
        ...validBase,
        sex: 'male',
        language: 'Greek',
      }).success,
    ).toBe(true)
    expect(
      PatientFormSchema.safeParse({
        ...validBase,
        sex: 'female',
        language: 'English',
      }).success,
    ).toBe(true)
  })
})

describe('patientSexSelectValue', () => {
  it('maps legacy or empty sex to an unset select value', () => {
    expect(patientSexSelectValue('other')).toBeUndefined()
    expect(patientSexSelectValue('')).toBeUndefined()
    expect(patientSexSelectValue(null)).toBeUndefined()
  })

  it('keeps male and female selections', () => {
    expect(patientSexSelectValue('male')).toBe('male')
    expect(patientSexSelectValue('female')).toBe('female')
  })
})
