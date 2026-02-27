import { Avatar, Map, PatientProgram } from '@virtality/db'
import { useReducer, useEffect } from 'react'
import { CompleteExercise, PatientLocalData, VRDevice } from '@/types/models'
import useAvatar from './queries/use-avatar'
import useMap from './queries/use-map'
import usePatientPrograms from './queries/patient-program/use-patient-programs'

type State = {
  isSettingsOpen: { id: string; open: boolean } | null
  exercises: CompleteExercise[]
  isDialogOpen: boolean
  programState: 'started' | 'paused' | 'ready'
  selectedDevice: VRDevice | null
  selectedProgram: PatientProgram | null
  selectedMode: 'main' | 'free'
  selectedAvatar: Avatar | null
  selectedMap: Map | null
  inQuickStart: boolean
  activeExerciseData: {
    id: string | null
    currentSet: number
    totalSets: number
    currentRep: number
    totalReps: number
  }
}

const initialState: State = {
  isSettingsOpen: null,
  exercises: [],
  isDialogOpen: false,
  programState: 'ready',
  selectedDevice: null,
  selectedProgram: null,
  selectedMode: 'main',
  selectedAvatar: null,
  selectedMap: null,
  inQuickStart: false,
  activeExerciseData: {
    id: null,
    currentSet: 0,
    totalSets: 0,
    currentRep: 0,
    totalReps: 0,
  },
}

type SetterName<K extends string> = K extends `is${infer Rest}`
  ? `set${Capitalize<Rest>}`
  : `set${Capitalize<K>}`

type ActionsFromState<S> = {
  [K in keyof S & string]: { type: SetterName<K>; payload: S[K] }
}[keyof S & string]

type Action =
  | ActionsFromState<State>
  | { type: 'updatePatientDashboardState'; payload: Partial<State> }

function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setExercises':
      return { ...state, exercises: action.payload }
    case 'setSettingsOpen':
      return { ...state, isSettingsOpen: action.payload }
    case 'setDialogOpen':
      return { ...state, isDialogOpen: action.payload }
    case 'setSelectedProgram':
      return { ...state, selectedProgram: action.payload }
    case 'setSelectedDevice':
      return { ...state, selectedDevice: action.payload }
    case 'setSelectedMode':
      return { ...state, selectedMode: action.payload }
    case 'setSelectedAvatar':
      return { ...state, selectedAvatar: action.payload }
    case 'setSelectedMap':
      return { ...state, selectedMap: action.payload }
    case 'setProgramState':
      return { ...state, programState: action.payload }
    case 'setActiveExerciseData':
      return { ...state, activeExerciseData: action.payload }
    case 'setInQuickStart':
      return { ...state, inQuickStart: action.payload }
    case 'updatePatientDashboardState':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

interface usePatientDashboardStateProps {
  patientId: string
  patientLocalData: PatientLocalData
}

const usePatientDashboardState = ({
  patientLocalData,
  patientId,
}: usePatientDashboardStateProps) => {
  const [state, dispatch] = useReducer(stateReducer, initialState)
  const { data: avatars } = useAvatar()
  const { data: maps } = useMap()
  const { data: programs } = usePatientPrograms({ patientId })

  useEffect(() => {
    const program = programs?.find(
      (program) => program.id === patientLocalData.lastProgram,
    )

    if (program && !state.selectedProgram) {
      const { programExercise: exercises } = program

      const firstExercise = exercises[0]

      updatePatientDashboardState({
        selectedProgram: program,
        exercises,
        activeExerciseData: {
          ...state.activeExerciseData,
          id: firstExercise ? firstExercise.exerciseId : null,
        },
      })
    }

    const avatar = avatars?.find(
      (avatar) => avatar.id === patientLocalData.lastAvatar,
    )

    if (avatar) setSelectedAvatar(avatar)

    const map = maps?.find((map) => map.id === patientLocalData.lastMap)

    if (map) setSelectedMap(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatars, maps, patientLocalData, dispatch, programs])

  const setSelectedMode = (value: 'main' | 'free') => {
    dispatch({ type: 'setSelectedMode', payload: value })
  }

  const setSelectedAvatar = (payload: State['selectedAvatar']) => {
    dispatch({ type: 'setSelectedAvatar', payload })
  }

  const setSelectedMap = (payload: State['selectedMap']) => {
    dispatch({ type: 'setSelectedMap', payload })
  }

  const setSelectedDevice = (payload: VRDevice | null) => {
    dispatch({ type: 'setSelectedDevice', payload })
  }

  const setSelectedProgram = (program: State['selectedProgram']) => {
    dispatch({ type: 'setSelectedProgram', payload: program })
  }

  const setExercises = (exercises: State['exercises']) => {
    dispatch({ type: 'setExercises', payload: exercises })
  }

  const setDialogOpen = (open: boolean) => {
    dispatch({ type: 'setDialogOpen', payload: open })
  }

  const setProgramState = (payload: State['programState']) => {
    dispatch({ type: 'setProgramState', payload })
  }

  const setActiveExerciseData = (payload: State['activeExerciseData']) => {
    dispatch({ type: 'setActiveExerciseData', payload })
  }

  const setInQuickStart = (payload: State['inQuickStart']) => {
    dispatch({ type: 'setInQuickStart', payload })
  }

  const updatePatientDashboardState = (payload: Partial<State>) => {
    return dispatch({ type: 'updatePatientDashboardState', payload })
  }

  return {
    state,
    handler: {
      setSelectedMode,
      setProgramState,
      setSelectedDevice,
      setSelectedAvatar,
      setSelectedMap,
      setSelectedProgram,
      setExercises,
      setDialogOpen,
      setActiveExerciseData,
      setInQuickStart,
      updatePatientDashboardState,
    },
  }
}

export default usePatientDashboardState
