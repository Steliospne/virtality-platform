import { getConsoleUrl } from '@virtality/shared/types'
import { describe, expect, it } from 'vitest'
import {
  buildPathAndQuery,
  buildSignInHref,
  DEFAULT_POST_LOGIN_PATH,
  resolvePostLoginPath,
  toSocialSignInCallbackUrl,
  validateSignInRedirectTarget,
} from './sign-in-redirect.js'

describe('validateSignInRedirectTarget', () => {
  it('accepts same-origin relative paths with query strings', () => {
    expect(
      validateSignInRedirectTarget(
        '/user/abc/profile?tab=billing&access_code=GO-XYZ',
      ),
    ).toBe('/user/abc/profile?tab=billing&access_code=GO-XYZ')
  })

  it('rejects absolute and protocol-relative targets', () => {
    expect(
      validateSignInRedirectTarget('https://evil.example/phish'),
    ).toBeNull()
    expect(validateSignInRedirectTarget('//evil.example/phish')).toBeNull()
    expect(validateSignInRedirectTarget('/\\evil.example/phish')).toBeNull()
  })

  it('rejects empty and non-path values', () => {
    expect(validateSignInRedirectTarget(null)).toBeNull()
    expect(validateSignInRedirectTarget('')).toBeNull()
    expect(validateSignInRedirectTarget('user/profile')).toBeNull()
  })
})

describe('resolvePostLoginPath', () => {
  it('honors a valid redirect and falls back to the default home path', () => {
    expect(resolvePostLoginPath('/user/abc/profile?tab=billing')).toBe(
      '/user/abc/profile?tab=billing',
    )
    expect(resolvePostLoginPath('https://evil.example')).toBe(
      DEFAULT_POST_LOGIN_PATH,
    )
    expect(resolvePostLoginPath(null)).toBe(DEFAULT_POST_LOGIN_PATH)
  })
})

describe('buildSignInHref', () => {
  it('encodes the requested return path on the sign-in URL', () => {
    expect(
      buildSignInHref('/user/abc/profile?tab=billing&access_code=GO-XYZ'),
    ).toBe(
      '/sign-in?redirect=%2Fuser%2Fabc%2Fprofile%3Ftab%3Dbilling%26access_code%3DGO-XYZ',
    )
  })
})

describe('buildPathAndQuery', () => {
  it('rebuilds pathname and search from profile search params', () => {
    expect(
      buildPathAndQuery('/user/user_1/profile', {
        tab: 'billing',
        access_code: 'GO-XYZ',
      }),
    ).toBe('/user/user_1/profile?tab=billing&access_code=GO-XYZ')
  })
})

describe('toSocialSignInCallbackUrl', () => {
  it('uses the console origin for the default post-login destination', () => {
    expect(toSocialSignInCallbackUrl(DEFAULT_POST_LOGIN_PATH)).toBe(
      getConsoleUrl(),
    )
    expect(toSocialSignInCallbackUrl(DEFAULT_POST_LOGIN_PATH)).not.toContain(
      '/user/',
    )
  })

  it('resolves a validated redirect to an absolute console URL', () => {
    expect(toSocialSignInCallbackUrl('/user/abc/profile?tab=billing')).toMatch(
      /\/user\/abc\/profile\?tab=billing$/,
    )
  })

  it('ignores malicious redirects for Google callback', () => {
    expect(toSocialSignInCallbackUrl('https://evil.example')).toBe(
      getConsoleUrl(),
    )
    expect(toSocialSignInCallbackUrl('https://evil.example')).not.toContain(
      'evil.example',
    )
  })
})
