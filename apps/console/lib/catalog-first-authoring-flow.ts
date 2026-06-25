/**
 * Shared catalog-first program authoring flow (PRD #98, GitHub #99).
 * Step one is the exercise catalog; step two is the selected Program Exercise list/settings.
 * Exercise selection and settings live outside this reducer — callers must not reset them on back navigation.
 */

export const CATALOG_FIRST_AUTHORING_STEPS = [
  'catalog',
  'selected-list',
] as const

export type CatalogFirstAuthoringStep =
  (typeof CATALOG_FIRST_AUTHORING_STEPS)[number]

export const INITIAL_CATALOG_FIRST_AUTHORING_STEP =
  CATALOG_FIRST_AUTHORING_STEPS[0]

export const SELECTED_LIST_CATALOG_FIRST_AUTHORING_STEP =
  CATALOG_FIRST_AUTHORING_STEPS[1]

export type CatalogFirstAuthoringFlowState = {
  step: CatalogFirstAuthoringStep
}

export type CatalogFirstAuthoringFlowAction =
  | { type: 'advanceToSelectedList' }
  | { type: 'returnToCatalog' }
  | { type: 'reset' }

export function createCatalogFirstAuthoringFlowState(): CatalogFirstAuthoringFlowState {
  return { step: INITIAL_CATALOG_FIRST_AUTHORING_STEP }
}

export function catalogFirstAuthoringFlowReducer(
  state: CatalogFirstAuthoringFlowState,
  action: CatalogFirstAuthoringFlowAction,
): CatalogFirstAuthoringFlowState {
  switch (action.type) {
    case 'advanceToSelectedList':
      return { step: SELECTED_LIST_CATALOG_FIRST_AUTHORING_STEP }
    case 'returnToCatalog':
      return { step: INITIAL_CATALOG_FIRST_AUTHORING_STEP }
    case 'reset':
      return createCatalogFirstAuthoringFlowState()
    default:
      return state
  }
}

/** Catalog -> selected-list is always allowed, including with zero exercises. */
export function canAdvanceFromCatalogToSelectedList(
  _selectedExerciseCount: number,
): boolean {
  return true
}

export function isCatalogStep(step: CatalogFirstAuthoringStep): boolean {
  return step === INITIAL_CATALOG_FIRST_AUTHORING_STEP
}

export function isSelectedListStep(step: CatalogFirstAuthoringStep): boolean {
  return step === SELECTED_LIST_CATALOG_FIRST_AUTHORING_STEP
}

/** Label shown near the Next action on the catalog step. */
export function catalogFirstSelectedExerciseCountLabel(count: number): string {
  if (count === 0) return 'No exercises selected'
  if (count === 1) return '1 exercise selected'
  return `${count} exercises selected`
}

export function selectionSnapshot<T>(selected: readonly T[]): readonly T[] {
  return [...selected]
}

export function selectionsEqual<T>(
  a: readonly T[],
  b: readonly T[],
  key: (item: T) => string,
): boolean {
  if (a.length !== b.length) return false
  const aKeys = a.map(key).sort()
  const bKeys = b.map(key).sort()
  return aKeys.every((value, index) => value === bKeys[index])
}

export function selectionPreservedAcrossStepTransitions<T>(
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
