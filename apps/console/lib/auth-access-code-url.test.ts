import { describe, expect, it } from 'vitest'
import {
  readAccessCodeFromSearchParams,
  signInHref,
  signUpHref,
} from './auth-access-code-url.js'

describe('auth access code URLs', () => {
  it('reads access_code from search params', () => {
    const params = new URLSearchParams('access_code=GO-ABC123')
    expect(readAccessCodeFromSearchParams(params)).toBe('GO-ABC123')
    expect(readAccessCodeFromSearchParams(new URLSearchParams())).toBe('')
  })

  it('omits query when access code is missing or blank', () => {
    expect(signInHref()).toBe('/sign-in')
    expect(signInHref('   ')).toBe('/sign-in')
    expect(signUpHref('')).toBe('/sign-up')
  })

  it('carries trimmed, encoded access_code in auth links', () => {
    expect(signInHref('  GO+A/B  ')).toBe('/sign-in?access_code=GO%2BA%2FB')
    expect(signUpHref('GO-ABC123')).toBe('/sign-up?access_code=GO-ABC123')
  })
})
