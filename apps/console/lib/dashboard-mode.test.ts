import { describe, expect, it } from 'vitest'
import { parseDashboardMode } from './dashboard-mode'

describe('parseDashboardMode', () => {
  it('accepts known modes', () => {
    expect(parseDashboardMode('main')).toBe('main')
    expect(parseDashboardMode('free')).toBe('free')
    expect(parseDashboardMode('immersive')).toBe('immersive')
  })

  it('rejects anything else', () => {
    expect(parseDashboardMode('vr')).toBeNull()
    expect(parseDashboardMode(undefined)).toBeNull()
    expect(parseDashboardMode(1)).toBeNull()
  })
})
