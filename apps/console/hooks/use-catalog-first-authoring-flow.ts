import { useReducer } from 'react'
import {
  canAdvanceFromCatalogToSelectedList,
  catalogFirstAuthoringFlowReducer,
  catalogFirstSelectedExerciseCountLabel,
  createCatalogFirstAuthoringFlowState,
  isCatalogStep,
  isSelectedListStep,
} from '@/lib/catalog-first-authoring-flow'

export function useCatalogFirstAuthoringFlow() {
  const [{ step }, dispatch] = useReducer(
    catalogFirstAuthoringFlowReducer,
    undefined,
    createCatalogFirstAuthoringFlowState,
  )

  const goToSelectedList = () => {
    dispatch({ type: 'advanceToSelectedList' })
  }

  const goToCatalog = () => {
    dispatch({ type: 'returnToCatalog' })
  }

  const resetFlow = () => {
    dispatch({ type: 'reset' })
  }

  return {
    step,
    isCatalogStep: isCatalogStep(step),
    isSelectedListStep: isSelectedListStep(step),
    goToSelectedList,
    goToCatalog,
    resetFlow,
    selectedExerciseCountLabel: catalogFirstSelectedExerciseCountLabel,
    canGoToSelectedList: canAdvanceFromCatalogToSelectedList,
  }
}

export type UseCatalogFirstAuthoringFlowResult = ReturnType<
  typeof useCatalogFirstAuthoringFlow
>
