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

type SampleSelection = { id: string; exerciseId: string }

const sampleSelection: SampleSelection[] = [
  { id: 'row-1', exerciseId: 'ex-1' },
  { id: 'row-2', exerciseId: 'ex-2' },
]

function selectionSnapshot<T>(selected: readonly T[]): readonly T[] {
  return [...selected]
}

function selectionsEqual<T>(
  a: readonly T[],
  b: readonly T[],
  key: (item: T) => string,
): boolean {
  if (a.length !== b.length) return false
  const aKeys = a.map(key).sort()
  const bKeys = b.map(key).sort()
  return aKeys.every((value, index) => value === bKeys[index])
}

function selectionPreservedAcrossStepTransitions<T>(
  beforeAdvance: readonly T[],
  duringSelectedList: readonly T[],
  afterReturnToCatalog: readonly T[],
  key: (item: T) => string,
): boolean {
  return (
    selectionsEqual(beforeAdvance, duringSelectedList, key) &&
    selectionsEqual(beforeAdvance, afterReturnToCatalog, key)
  )
}

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
    expect(canAdvanceFromCatalogToSelectedList(0)).toBe(true)

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

describe('catalog-first selection preservation', () => {
  it('keeps selection snapshots stable across step transitions', () => {
    const before = selectionSnapshot(sampleSelection)

    let flowState = createCatalogFirstAuthoringFlowState()
    flowState = catalogFirstAuthoringFlowReducer(flowState, {
      type: 'advanceToSelectedList',
    })
    const duringSelectedList = selectionSnapshot(sampleSelection)

    flowState = catalogFirstAuthoringFlowReducer(flowState, {
      type: 'returnToCatalog',
    })
    const afterReturnToCatalog = selectionSnapshot(sampleSelection)

    expect(
      selectionPreservedAcrossStepTransitions(
        before,
        duringSelectedList,
        afterReturnToCatalog,
        (item) => item.id,
      ),
    ).toBe(true)
  })

  it('compares selections by row id for preservation checks', () => {
    const reordered = [
      { id: 'row-2', exerciseId: 'ex-2' },
      { id: 'row-1', exerciseId: 'ex-1' },
    ]

    expect(selectionsEqual(sampleSelection, reordered, (item) => item.id)).toBe(
      true,
    )
    expect(
      selectionsEqual(
        sampleSelection,
        [{ id: 'row-3', exerciseId: 'ex-3' }],
        (item) => item.id,
      ),
    ).toBe(false)
  })
})
