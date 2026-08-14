import { describe, expect, it } from 'vitest'
import { resolveDialogOpen } from './resolve-dialog-open.js'

describe('resolveDialogOpen', () => {
  it('keeps controlled false instead of falling through to internal state', () => {
    expect(resolveDialogOpen(false, true)).toBe(false)
    expect(resolveDialogOpen(false, false)).toBe(false)
  })

  it('uses controlled true', () => {
    expect(resolveDialogOpen(true, false)).toBe(true)
  })

  it('uses internal state when uncontrolled', () => {
    expect(resolveDialogOpen(undefined, true)).toBe(true)
    expect(resolveDialogOpen(undefined, false)).toBe(false)
  })
})
