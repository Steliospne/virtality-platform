import { describe, expect, it } from 'vitest'
import { isValidPassword } from './password-policy.ts'

const validatePassword = (value: string) => {
  const issues: { message: string }[] = []
  isValidPassword({
    value,
    issues,
  } as Parameters<typeof isValidPassword>[0])
  return issues
}

describe('isValidPassword', () => {
  it('accepts passwords that meet the shared policy', () => {
    expect(validatePassword('ValidPass1')).toEqual([])
  })

  it('rejects passwords that are too short or missing required character classes', () => {
    expect(validatePassword('short1')).not.toEqual([])
    expect(validatePassword('alllowercase1')).not.toEqual([])
    expect(validatePassword('ALLUPPERCASE1')).not.toEqual([])
    expect(validatePassword('NoDigitsHere')).not.toEqual([])
  })
})
