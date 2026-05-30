import { describe, expect, it } from 'vitest'

import {
  PHASE_1_COMPONENTS,
  PROMOTED_COMPONENTS,
  SHARED_UI_PACKAGE,
  canonicalSharedImport,
  isPhase1Component,
  isPromotedComponent,
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

  it('promotes every phase-1 component', () => {
    expect([...PROMOTED_COMPONENTS]).toEqual([...PHASE_1_COMPONENTS])
  })

  it('builds canonical shared import paths', () => {
    expect(canonicalSharedImport('label')).toBe(
      '@virtality/ui/components/label',
    )
  })

  it('identifies phase-1 and promoted component names', () => {
    expect(isPhase1Component('badge')).toBe(true)
    expect(isPhase1Component('dialog')).toBe(false)
    expect(isPromotedComponent('card')).toBe(true)
    expect(isPromotedComponent('dialog')).toBe(false)
  })

  it('uses the shared UI package name', () => {
    expect(SHARED_UI_PACKAGE).toBe('@virtality/ui')
  })
})
