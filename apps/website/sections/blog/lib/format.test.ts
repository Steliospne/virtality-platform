import { describe, expect, it } from 'vitest'
import { youtubeEmbedUrl } from './format'

describe('youtubeEmbedUrl', () => {
  it('preserves a YouTube start time in the embed URL', () => {
    expect(
      youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=920'),
    ).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?start=920')
  })

  it('creates an embed URL without a start time when none is provided', () => {
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    )
  })
})
