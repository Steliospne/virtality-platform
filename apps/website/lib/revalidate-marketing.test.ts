import { describe, expect, it } from 'vitest'
import { MARKETING_CACHE_TAGS } from '@virtality/shared/types'
import {
  authorizeRevalidateRequest,
  handleRevalidateMarketingRequest,
  parseRevalidateMarketingBody,
  resolveRevalidateTags,
} from './revalidate-marketing'

describe('authorizeRevalidateRequest', () => {
  it('rejects when secret is missing (fail closed)', () => {
    expect(authorizeRevalidateRequest('Bearer secret', undefined)).toBe(false)
    expect(authorizeRevalidateRequest('Bearer secret', '   ')).toBe(false)
  })

  it('rejects missing or non-Bearer Authorization', () => {
    expect(authorizeRevalidateRequest(null, 'secret')).toBe(false)
    expect(authorizeRevalidateRequest('secret', 'secret')).toBe(false)
    expect(authorizeRevalidateRequest('Basic secret', 'secret')).toBe(false)
  })

  it('accepts matching Bearer token', () => {
    expect(authorizeRevalidateRequest('Bearer secret', 'secret')).toBe(true)
    expect(authorizeRevalidateRequest('bearer secret', 'secret')).toBe(true)
  })
})

describe('parseRevalidateMarketingBody', () => {
  it('requires exactly one of tag or all', () => {
    expect(parseRevalidateMarketingBody({}).ok).toBe(false)
    expect(parseRevalidateMarketingBody({ tag: 'mosaic', all: true }).ok).toBe(
      false,
    )
  })

  it('rejects unknown tags', () => {
    expect(parseRevalidateMarketingBody({ tag: 'waitlist' }).ok).toBe(false)
  })

  it('accepts allowlisted tag or all: true', () => {
    expect(parseRevalidateMarketingBody({ tag: 'mosaic' })).toEqual({
      ok: true,
      value: { tag: 'mosaic' },
    })
    expect(parseRevalidateMarketingBody({ all: true })).toEqual({
      ok: true,
      value: { all: true },
    })
  })
})

describe('resolveRevalidateTags', () => {
  it('expands all to the full allowlist', () => {
    expect(resolveRevalidateTags({ all: true })).toEqual([
      ...MARKETING_CACHE_TAGS,
    ])
  })

  it('returns a single tag', () => {
    expect(resolveRevalidateTags({ tag: 'partner-logos' })).toEqual([
      'partner-logos',
    ])
  })
})

describe('handleRevalidateMarketingRequest', () => {
  it('returns 401 for bad auth before validating body', () => {
    expect(
      handleRevalidateMarketingRequest({
        authorizationHeader: null,
        secret: 'secret',
        body: { tag: 'mosaic' },
      }),
    ).toEqual({ ok: false, status: 401, error: 'Unauthorized' })
  })

  it('returns 400 for bad body when auth succeeds', () => {
    expect(
      handleRevalidateMarketingRequest({
        authorizationHeader: 'Bearer secret',
        secret: 'secret',
        body: { tag: 'nope' },
      }),
    ).toEqual({
      ok: false,
      status: 400,
      error: 'Unknown or invalid tag',
    })
  })

  it('returns tags to bust on success', () => {
    expect(
      handleRevalidateMarketingRequest({
        authorizationHeader: 'Bearer secret',
        secret: 'secret',
        body: { all: true },
      }),
    ).toEqual({ ok: true, tags: [...MARKETING_CACHE_TAGS] })
  })
})
