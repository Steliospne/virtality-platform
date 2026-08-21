/**
 * Shared program authoring flow (evolved from PRD #98 catalog-first).
 * Default entry is settings (selected-list); scratch create and quick start can
 * open on the exercise catalog instead. Callers keep exercise selection outside
 * this reducer and must not reset it on back navigation.
 */

export const CATALOG_FIRST_AUTHORING_STEPS = [
  'selected-list',
  'catalog',
] as const

export type CatalogFirstAuthoringStep =
  (typeof CATALOG_FIRST_AUTHORING_STEPS)[number]

export const INITIAL_CATALOG_FIRST_AUTHORING_STEP =
  CATALOG_FIRST_AUTHORING_STEPS[0]

export const SELECTED_LIST_CATALOG_FIRST_AUTHORING_STEP = 'selected-list'

export const CATALOG_CATALOG_FIRST_AUTHORING_STEP = 'catalog'

export type CatalogFirstAuthoringFlowState = {
  step: CatalogFirstAuthoringStep
  initialStep: CatalogFirstAuthoringStep
}

export type CatalogFirstAuthoringFlowAction =
  | { type: 'advanceToSelectedList' }
  | { type: 'returnToCatalog' }
  | { type: 'reset' }

export function createCatalogFirstAuthoringFlowState(
  initialStep: CatalogFirstAuthoringStep = INITIAL_CATALOG_FIRST_AUTHORING_STEP,
): CatalogFirstAuthoringFlowState {
  return { step: initialStep, initialStep }
}

export function catalogFirstAuthoringFlowReducer(
  state: CatalogFirstAuthoringFlowState,
  action: CatalogFirstAuthoringFlowAction,
): CatalogFirstAuthoringFlowState {
  switch (action.type) {
    case 'advanceToSelectedList':
      return { ...state, step: SELECTED_LIST_CATALOG_FIRST_AUTHORING_STEP }
    case 'returnToCatalog':
      return { ...state, step: CATALOG_CATALOG_FIRST_AUTHORING_STEP }
    case 'reset':
      return { ...state, step: state.initialStep }
    default:
      return state
  }
}

/** Selected-list -> catalog is always allowed, including with zero exercises. */
export function canAdvanceFromSelectedListToCatalog(): boolean {
  return true
}

/** @deprecated Prefer canAdvanceFromSelectedListToCatalog; kept for call-site compatibility. */
export function canAdvanceFromCatalogToSelectedList(): boolean {
  return true
}

export function isCatalogStep(step: CatalogFirstAuthoringStep): boolean {
  return step === CATALOG_CATALOG_FIRST_AUTHORING_STEP
}

export function isSelectedListStep(step: CatalogFirstAuthoringStep): boolean {
  return step === SELECTED_LIST_CATALOG_FIRST_AUTHORING_STEP
}

/** Label shown near the Done action on the catalog step. */
export function catalogFirstSelectedExerciseCountLabel(count: number): string {
  if (count === 0) return 'No exercises selected'
  if (count === 1) return '1 exercise selected'
  return `${count} exercises selected`
}
