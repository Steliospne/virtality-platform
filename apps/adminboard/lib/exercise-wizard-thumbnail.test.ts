import { describe, expect, it } from 'vitest'
import {
  EXERCISE_THUMBNAIL_DEFAULT_FORM,
  EXERCISE_THUMBNAIL_MAX_DIMENSION,
  exerciseThumbnailFile,
  exerciseThumbnailOrientationFor,
  extensionForExerciseThumbnailFormat,
  formatExerciseThumbnailBytes,
  isExerciseThumbnailFormat,
  mimeTypeForExerciseThumbnailFormat,
  normalizeExerciseThumbnailQuality,
  parseExerciseThumbnailForm,
} from './exercise-wizard-thumbnail'

describe('format helpers', () => {
  it('maps formats to mime types', () => {
    expect(mimeTypeForExerciseThumbnailFormat('jpg')).toBe('image/jpeg')
    expect(mimeTypeForExerciseThumbnailFormat('png')).toBe('image/png')
    expect(mimeTypeForExerciseThumbnailFormat('webp')).toBe('image/webp')
  })

  it('maps formats to extensions', () => {
    expect(extensionForExerciseThumbnailFormat('jpg')).toBe('jpg')
    expect(extensionForExerciseThumbnailFormat('png')).toBe('png')
    expect(extensionForExerciseThumbnailFormat('webp')).toBe('webp')
  })

  it('guards format strings', () => {
    expect(isExerciseThumbnailFormat('jpg')).toBe(true)
    expect(isExerciseThumbnailFormat('gif')).toBe(false)
  })
})

describe('formatExerciseThumbnailBytes', () => {
  it('picks a unit by magnitude', () => {
    expect(formatExerciseThumbnailBytes(512)).toBe('512 B')
    expect(formatExerciseThumbnailBytes(2048)).toBe('2.0 KB')
    expect(formatExerciseThumbnailBytes(3 * 1024 * 1024)).toBe('3.00 MB')
  })
})

describe('normalizeExerciseThumbnailQuality', () => {
  it('clamps to 1..100 and scales to 0..1', () => {
    expect(normalizeExerciseThumbnailQuality('92')).toBeCloseTo(0.92)
    expect(normalizeExerciseThumbnailQuality('0')).toBeCloseTo(0.01)
    expect(normalizeExerciseThumbnailQuality('250')).toBe(1)
  })

  it('falls back to 0.92 for non-numeric input', () => {
    expect(normalizeExerciseThumbnailQuality('abc')).toBeCloseTo(0.92)
  })
})

describe('parseExerciseThumbnailForm', () => {
  it('parses the default form', () => {
    expect(parseExerciseThumbnailForm(EXERCISE_THUMBNAIL_DEFAULT_FORM)).toEqual(
      {
        timestampSec: 0,
        width: 1280,
        height: 720,
        format: 'jpg',
        quality: 0.92,
      },
    )
  })

  it('rounds fractional dimensions', () => {
    expect(
      parseExerciseThumbnailForm({
        ...EXERCISE_THUMBNAIL_DEFAULT_FORM,
        width: '100.6',
        height: '99.4',
      }),
    ).toMatchObject({ width: 101, height: 99 })
  })

  it('rejects a negative timestamp', () => {
    expect(() =>
      parseExerciseThumbnailForm({
        ...EXERCISE_THUMBNAIL_DEFAULT_FORM,
        timestampSec: '-1',
      }),
    ).toThrow(/Timestamp/)
  })

  it('rejects out-of-range dimensions', () => {
    expect(() =>
      parseExerciseThumbnailForm({
        ...EXERCISE_THUMBNAIL_DEFAULT_FORM,
        width: '0',
      }),
    ).toThrow(/Resolution/)
    expect(() =>
      parseExerciseThumbnailForm({
        ...EXERCISE_THUMBNAIL_DEFAULT_FORM,
        height: String(EXERCISE_THUMBNAIL_MAX_DIMENSION + 1),
      }),
    ).toThrow(/Resolution/)
  })
})

describe('exerciseThumbnailFile', () => {
  it('names the file by format with the matching mime type', () => {
    const file = exerciseThumbnailFile(new Blob(['x']), 'webp')
    expect(file.name).toBe('thumbnail.webp')
    expect(file.type).toBe('image/webp')
  })
})

describe('exerciseThumbnailOrientationFor', () => {
  it('recognises the presets', () => {
    expect(
      exerciseThumbnailOrientationFor({ width: '1280', height: '720' }),
    ).toBe('landscape')
    expect(
      exerciseThumbnailOrientationFor({ width: '270', height: '480' }),
    ).toBe('portrait')
  })

  it('returns null for custom sizes', () => {
    expect(
      exerciseThumbnailOrientationFor({ width: '800', height: '600' }),
    ).toBeNull()
  })
})
