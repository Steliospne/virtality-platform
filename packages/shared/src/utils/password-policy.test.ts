import { describe, expect, it } from 'vitest'
import { collectPasswordIssues } from './password-policy.ts'

describe('isValidPassword', () => {
  it('accepts passwords that meet the shared policy', () => {
    expect(collectPasswordIssues('ValidPass1')).toEqual([])
  })

  it('rejects passwords that are too short or missing required character classes', () => {
    expect(collectPasswordIssues('short1')).not.toEqual([])
    expect(collectPasswordIssues('alllowercase1')).not.toEqual([])
    expect(collectPasswordIssues('ALLUPPERCASE1')).not.toEqual([])
    expect(collectPasswordIssues('NoDigitsHere')).not.toEqual([])
  })
})
