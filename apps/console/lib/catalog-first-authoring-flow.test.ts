import { describe, expect, it } from 'vitest'
import {
  CATALOG_FIRST_AUTHORING_STEPS,
  canAdvanceFromSelectedListToCatalog,
  catalogFirstAuthoringFlowReducer,
  catalogFirstSelectedExerciseCountLabel,
  createCatalogFirstAuthoringFlowState,
  isCatalogStep,
  isSelectedListStep,
} from './catalog-first-authoring-flow.js'

describe('settings-first authoring step order', () => {
  it('defines selected-list then catalog as the canonical step order', () => {
    expect(CATALOG_FIRST_AUTHORING_STEPS).toEqual(['selected-list', 'catalog'])
  })

  it('starts on the selected-list step', () => {
    expect(createCatalogFirstAuthoringFlowState().step).toBe('selected-list')
    expect(isSelectedListStep('selected-list')).toBe(true)
    expect(isCatalogStep('selected-list')).toBe(false)
  })

  it('advances from selected-list to catalog', () => {
    let state = createCatalogFirstAuthoringFlowState()

    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'returnToCatalog',
    })

    expect(state.step).toBe('catalog')
    expect(isCatalogStep(state.step)).toBe(true)
  })

  it('returns from catalog to selected-list', () => {
    let state = catalogFirstAuthoringFlowReducer(
      createCatalogFirstAuthoringFlowState(),
      { type: 'returnToCatalog' },
    )

    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'advanceToSelectedList',
    })

    expect(state.step).toBe('selected-list')
  })

  it('resets to the selected-list step', () => {
    const state = catalogFirstAuthoringFlowReducer(
      { step: 'catalog' },
      { type: 'reset' },
    )

    expect(state.step).toBe('selected-list')
  })
})

describe('settings-first authoring navigation guards', () => {
  it('allows advancing to catalog with zero selected exercises', () => {
    expect(canAdvanceFromSelectedListToCatalog()).toBe(true)

    let state = createCatalogFirstAuthoringFlowState()
    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'returnToCatalog',
    })

    expect(state.step).toBe('catalog')
  })
})

describe('settings-first selected exercise count label', () => {
  it('shows a zero-selection label near the catalog Done action', () => {
    expect(catalogFirstSelectedExerciseCountLabel(0)).toBe(
      'No exercises selected',
    )
  })

  it('uses singular and plural labels for non-zero counts', () => {
    expect(catalogFirstSelectedExerciseCountLabel(1)).toBe(
      '1 exercise selected',
    )
    expect(catalogFirstSelectedExerciseCountLabel(3)).toBe(
      '3 exercises selected',
    )
  })
})

describe('settings-first selection ownership', () => {
  it('only mutates step state so callers keep exercise selection across navigation', () => {
    let state = createCatalogFirstAuthoringFlowState()
    expect(state).toEqual({ step: 'selected-list' })

    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'returnToCatalog',
    })
    expect(state).toEqual({ step: 'catalog' })

    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'advanceToSelectedList',
    })
    expect(state).toEqual({ step: 'selected-list' })
  })
})
