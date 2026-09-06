import { describe, expect, it } from 'vitest'
import { formatExtensionClockEnd } from './entitlement-extension.ts'

describe('formatExtensionClockEnd', () => {
  it('formats a clock end for staff dialogs', () => {
    expect(
      formatExtensionClockEnd(new Date('2026-08-17T12:00:00.000Z')),
    ).toMatch(/2026/)
  })

  it('handles missing clock ends', () => {
    expect(formatExtensionClockEnd(null)).toBe('No clock end synced yet')
  })
})
