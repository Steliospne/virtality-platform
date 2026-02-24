import { CompleteExercise } from '@/types/models'
import { Exercise } from '@virtality/db'
import { useReducer } from 'react'

type State = {
  selectedExercises: CompleteExercise[]
  isSelected: { [exerciseId: Exercise['id']]: boolean } | null
  toggledSettings: { [id: string]: boolean } | null
  selectedItems: string[]
  globalCheck: boolean
  isLibraryOpen: boolean
}

type Action =
  | {
      type: 'selectExercise'
      payload: State['selectedExercises'][number]
    }
  | {
      type: 'updateExercises'
      payload: State['selectedExercises']
    }
  | {
      type: 'removeExercise'
      payload: State['selectedExercises'][number]['exerciseId']
    }
  | {
      type: 'updateExerciseSettings'
      payload: State['selectedExercises']
    }
  | {
      type: 'toggleSettings'
      payload: State['toggledSettings']
    }
  | {
      type: 'setSelectedItems'
      payload: string[]
    }
  | {
      type: 'setGlobalCheck'
      payload: boolean
    }
  | {
      type: 'setLibraryOpen'
      payload: boolean
    }
  | {
      type: 'updateFormState'
      payload: Partial<State>
    }

const getSelected = (exercises: State['selectedExercises']) =>
  exercises
    .map((e) => ({ [e.exerciseId]: true }))
    .reduce((selected, curr) => ({ ...selected, ...curr }), {})

const getToggledSettings = (exercises: State['selectedExercises']) =>
  exercises
    .map((e) => ({ [e.id]: true }))
    .reduce((selected, curr) => ({ ...selected, ...curr }), {})

const initialState: State = {
  selectedExercises: [],
  isSelected: null,
  toggledSettings: null,
  selectedItems: [],
  globalCheck: false,
  isLibraryOpen: false,
}

const stateReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'selectExercise':
      return {
        ...state,
        toggledSettings: {
          ...state.toggledSettings,
          [action.payload.id]: true,
        },
        selectedExercises: [...state.selectedExercises, { ...action.payload }],
        isSelected: { ...state.isSelected, [action.payload.exerciseId]: true },
      }
    case 'updateExercises':
      return {
        ...state,
        selectedExercises: action.payload,
        isSelected: getSelected(action.payload),
        toggledSettings: getToggledSettings(action.payload),
      }
    case 'updateExerciseSettings':
      return { ...state, selectedExercises: action.payload }
    case 'removeExercise':
      const removed = state.selectedExercises.filter(
        (e) => e.exerciseId !== action.payload,
      )
      return {
        ...state,
        selectedExercises: removed,
        isSelected: {
          ...state.isSelected,
          [action.payload]: false,
        },
      }
    case 'toggleSettings':
      return {
        ...state,
        toggledSettings: { ...state.toggledSettings, ...action.payload },
      }
    case 'setSelectedItems':
      return { ...state, selectedItems: action.payload }
    case 'setGlobalCheck':
      return { ...state, globalCheck: action.payload }
    case 'setLibraryOpen':
      return { ...state, isLibraryOpen: action.payload }
    case 'updateFormState':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

export type useExerciseLibraryStateType = ReturnType<
  typeof useExerciseLibraryState
>

interface useExerciseLibraryStateProps {
  initialExercises?: State['selectedExercises']
}

const useExerciseLibraryState = ({
  initialExercises,
}: useExerciseLibraryStateProps) => {
  const [state, dispatch] = useReducer(stateReducer, initialState)

  const removeExercise = (
    payload: State['selectedExercises'][number]['exerciseId'],
  ) => {
    dispatch({ type: 'removeExercise', payload })
  }

  const selectExercise = (payload: State['selectedExercises'][number]) => {
    return dispatch({ type: 'selectExercise', payload })
  }

  const setSelectedItems = (items: string[]) => {
    dispatch({ type: 'setSelectedItems', payload: items })
  }

  const setGlobalCheck = (checked: boolean) => {
    dispatch({ type: 'setGlobalCheck', payload: checked })
  }

  const setLibraryOpen = (open: boolean) => {
    dispatch({ type: 'setLibraryOpen', payload: open })
  }

  const updateFormState = (updates: Partial<State>) => {
    dispatch({ type: 'updateFormState', payload: updates })
  }

  const setToggledSettings = (data: State['toggledSettings']) => {
    dispatch({ type: 'toggleSettings', payload: { ...data } })
  }

  const updateExercises = (exercises: State['selectedExercises']) => {
    dispatch({ type: 'updateExercises', payload: exercises })
  }

  if (initialExercises) updateExercises(initialExercises)

  return {
    state,
    handler: {
      removeExercise,
      setToggledSettings,
      selectExercise,
      updateExercises,
      updateFormState,
      setSelectedItems,
      setGlobalCheck,
      setLibraryOpen,
    },
  }
}

export default useExerciseLibraryState
