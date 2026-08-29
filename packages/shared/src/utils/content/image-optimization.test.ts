import { describe, expect, it } from 'vitest'
import { shouldBypassVercelImageOptimization } from './image-optimization.ts'

describe('shouldBypassVercelImageOptimization', () => {
  it('bypasses Virtality CDN URLs', () => {
    expect(
      shouldBypassVercelImageOptimization(
        'https://cdn.virtality.app/marketing/blogs/cover.jpg',
      ),
    ).toBe(true)
    expect(
      shouldBypassVercelImageOptimization(
        'https://cdn.virtality.app/2e78ac55ab9e56ef44091705aabeced201df5db4e6c6a92b2133ca556a93bbee',
      ),
    ).toBe(true)
  })

  it('does not bypass local public paths (including website hero assets)', () => {
    expect(
      shouldBypassVercelImageOptimization('/hero/ManNeuralFlipped-poster.jpg'),
    ).toBe(false)
    expect(shouldBypassVercelImageOptimization('/virtality_cyan.png')).toBe(
      false,
    )
    expect(shouldBypassVercelImageOptimization('/placeholder.svg')).toBe(false)
  })

  it('does not bypass non-CDN remote hosts or empty values', () => {
    expect(
      shouldBypassVercelImageOptimization(
        'https://avatars.githubusercontent.com/u/1',
      ),
    ).toBe(false)
    expect(shouldBypassVercelImageOptimization(null)).toBe(false)
    expect(shouldBypassVercelImageOptimization(undefined)).toBe(false)
    expect(shouldBypassVercelImageOptimization('')).toBe(false)
  })
})
