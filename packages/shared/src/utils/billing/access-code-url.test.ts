import { describe, expect, it } from 'vitest'
import { ACCESS_CODE_PARAM, readAccessCodePrefill } from './access-code-url.ts'

describe('readAccessCodePrefill', () => {
  it('reads access_code from a query string or URLSearchParams', () => {
    expect(
      readAccessCodePrefill(`?tab=billing&${ACCESS_CODE_PARAM}=GO-ABCDEFGH`),
    ).toBe('GO-ABCDEFGH')

    const params = new URLSearchParams()
    params.set(ACCESS_CODE_PARAM, '  GO-ABCDEFGH  ')
    expect(readAccessCodePrefill(params)).toBe('GO-ABCDEFGH')
  })

  it('returns null when access_code is missing or blank', () => {
    expect(readAccessCodePrefill('?tab=billing')).toBeNull()
    expect(readAccessCodePrefill(`?${ACCESS_CODE_PARAM}=`)).toBeNull()
    expect(readAccessCodePrefill(`?${ACCESS_CODE_PARAM}=%20`)).toBeNull()
  })
})
