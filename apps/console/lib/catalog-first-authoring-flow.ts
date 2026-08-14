/**
 * Shared settings-first program authoring flow (evolved from PRD #98 catalog-first).
 * Step one is the selected Program Exercise list/settings; step two is the exercise
 * catalog for adding or removing variants.
 * Exercise selection and settings live outside this reducer — callers must not reset them on back navigation.
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
      return { step: CATALOG_CATALOG_FIRST_AUTHORING_STEP }
    case 'reset':
      return createCatalogFirstAuthoringFlowState()
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
