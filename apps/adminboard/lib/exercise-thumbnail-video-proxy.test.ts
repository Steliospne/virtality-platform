import { describe, expect, it } from 'vitest'
import {
  exerciseThumbnailVideoProxyUrl,
  resolveVideoProxyTarget,
} from './exercise-thumbnail-video-proxy'

describe('exerciseThumbnailVideoProxyUrl', () => {
  it('encodes the CDN URL as a query parameter', () => {
    expect(
      exerciseThumbnailVideoProxyUrl('https://cdn.virtality.app/a b.mp4'),
    ).toBe('/api/video-proxy?url=https%3A%2F%2Fcdn.virtality.app%2Fa%20b.mp4')
  })
})

describe('resolveVideoProxyTarget', () => {
  it('accepts an https CDN URL', () => {
    const result = resolveVideoProxyTarget(
      'https://cdn.virtality.app/exercises/x.mp4',
    )
    expect(result.ok).toBe(true)
  })

  it('rejects a missing url', () => {
    expect(resolveVideoProxyTarget(null)).toMatchObject({
      ok: false,
      status: 400,
    })
  })

  it('rejects an unparsable url', () => {
    expect(resolveVideoProxyTarget('not a url')).toMatchObject({
      ok: false,
      status: 400,
    })
  })

  it('rejects http', () => {
    expect(
      resolveVideoProxyTarget('http://cdn.virtality.app/x.mp4'),
    ).toMatchObject({ ok: false, status: 400 })
  })

  it('rejects other hosts', () => {
    expect(resolveVideoProxyTarget('https://example.com/x.mp4')).toMatchObject({
      ok: false,
      status: 403,
    })
  })
})
