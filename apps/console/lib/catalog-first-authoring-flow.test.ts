import { describe, expect, it } from 'vitest'
import {
  CATALOG_FIRST_AUTHORING_STEPS,
  canAdvanceFromCatalogToSelectedList,
  catalogFirstAuthoringFlowReducer,
  catalogFirstSelectedExerciseCountLabel,
  createCatalogFirstAuthoringFlowState,
  isCatalogStep,
  isSelectedListStep,
} from './catalog-first-authoring-flow.js'

describe('catalog-first authoring step order', () => {
  it('defines catalog then selected-list as the canonical step order', () => {
    expect(CATALOG_FIRST_AUTHORING_STEPS).toEqual(['catalog', 'selected-list'])
  })

  it('starts on the catalog step', () => {
    expect(createCatalogFirstAuthoringFlowState().step).toBe('catalog')
    expect(isCatalogStep('catalog')).toBe(true)
    expect(isSelectedListStep('catalog')).toBe(false)
  })

  it('advances from catalog to selected-list', () => {
    let state = createCatalogFirstAuthoringFlowState()

    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'advanceToSelectedList',
    })

    expect(state.step).toBe('selected-list')
    expect(isSelectedListStep(state.step)).toBe(true)
  })

  it('returns from selected-list to catalog', () => {
    let state = catalogFirstAuthoringFlowReducer(
      createCatalogFirstAuthoringFlowState(),
      { type: 'advanceToSelectedList' },
    )

    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'returnToCatalog',
    })

    expect(state.step).toBe('catalog')
  })

  it('resets to the catalog step', () => {
    const state = catalogFirstAuthoringFlowReducer(
      { step: 'selected-list' },
      { type: 'reset' },
    )

    expect(state.step).toBe('catalog')
  })
})

describe('catalog-first authoring navigation guards', () => {
  it('allows advancing to selected-list with zero selected exercises', () => {
    expect(canAdvanceFromCatalogToSelectedList()).toBe(true)

    let state = createCatalogFirstAuthoringFlowState()
    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'advanceToSelectedList',
    })

    expect(state.step).toBe('selected-list')
  })
})

describe('catalog-first selected exercise count label', () => {
  it('shows a zero-selection label near the Next action', () => {
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

describe('catalog-first selection ownership', () => {
  it('only mutates step state so callers keep exercise selection across navigation', () => {
    let state = createCatalogFirstAuthoringFlowState()
    expect(state).toEqual({ step: 'catalog' })

    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'advanceToSelectedList',
    })
    expect(state).toEqual({ step: 'selected-list' })

    state = catalogFirstAuthoringFlowReducer(state, {
      type: 'returnToCatalog',
    })
    expect(state).toEqual({ step: 'catalog' })
  })
})
