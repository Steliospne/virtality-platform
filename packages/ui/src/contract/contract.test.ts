import { describe, expect, it } from 'vitest'

import {
  PHASE_1_COMPONENTS,
  PROMOTED_COMPONENTS,
  SHARED_UI_PACKAGE,
  canonicalSharedImport,
  isPhase1Component,
} from './index.ts'

describe('shared UI contract', () => {
  it('declares the phase-1 promotion batch', () => {
    expect([...PHASE_1_COMPONENTS]).toEqual([
      'label',
      'spinner',
      'input',
      'textarea',
      'separator',
      'badge',
      'card',
    ])
  })

  it('lists promoted phase-1 components after migration slices land', () => {
    expect([...PROMOTED_COMPONENTS]).toEqual([
      'label',
      'spinner',
      'input',
      'textarea',
      'separator',
      'badge',
      'card',
    ])
  })

  it('builds canonical shared import paths', () => {
    expect(canonicalSharedImport('label')).toBe(
      '@virtality/ui/components/label',
    )
  })

  it('identifies phase-1 component names', () => {
    expect(isPhase1Component('badge')).toBe(true)
    expect(isPhase1Component('dialog')).toBe(false)
  })

  it('uses the shared UI package name', () => {
    expect(SHARED_UI_PACKAGE).toBe('@virtality/ui')
  })
})
