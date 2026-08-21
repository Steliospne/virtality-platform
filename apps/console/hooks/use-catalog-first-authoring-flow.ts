import { useCallback, useReducer } from 'react'
import {
  canAdvanceFromSelectedListToCatalog,
  catalogFirstAuthoringFlowReducer,
  catalogFirstSelectedExerciseCountLabel,
  createCatalogFirstAuthoringFlowState,
  INITIAL_CATALOG_FIRST_AUTHORING_STEP,
  isCatalogStep,
  isSelectedListStep,
  type CatalogFirstAuthoringStep,
} from '@/lib/catalog-first-authoring-flow'

export type UseCatalogFirstAuthoringFlowOptions = {
  initialStep?: CatalogFirstAuthoringStep
}

export function useCatalogFirstAuthoringFlow(
  options?: UseCatalogFirstAuthoringFlowOptions,
) {
  const initialStep =
    options?.initialStep ?? INITIAL_CATALOG_FIRST_AUTHORING_STEP

  const [{ step }, dispatch] = useReducer(
    catalogFirstAuthoringFlowReducer,
    initialStep,
    createCatalogFirstAuthoringFlowState,
  )

  const goToSelectedList = useCallback(() => {
    dispatch({ type: 'advanceToSelectedList' })
  }, [])

  const goToCatalog = useCallback(() => {
    dispatch({ type: 'returnToCatalog' })
  }, [])

  const resetFlow = useCallback(() => {
    dispatch({ type: 'reset' })
  }, [])

  return {
    step,
    isCatalogStep: isCatalogStep(step),
    isSelectedListStep: isSelectedListStep(step),
    goToSelectedList,
    goToCatalog,
    resetFlow,
    selectedExerciseCountLabel: catalogFirstSelectedExerciseCountLabel,
    canGoToCatalog: canAdvanceFromSelectedListToCatalog,
    /** @deprecated Prefer canGoToCatalog; catalog is the optional second step. */
    canGoToSelectedList: canAdvanceFromSelectedListToCatalog,
  }
}

export type UseCatalogFirstAuthoringFlowResult = ReturnType<
  typeof useCatalogFirstAuthoringFlow
>
