import { useEffect } from 'react'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import { toast } from 'react-toastify'
// import { getClientT } from '@/i18n/get-client-t';
import useSocketConnection from '@/hooks/use-socket-connection'
import { useDeviceContext } from '@/context/device-context'
import { useRow, useStore, useValue } from 'tinybase/ui-react'
import { PatientLocalData } from '@/types/models'
import { type ProgramStartPayload } from '@virtality/shared/types'
import ErrorToasty from '@/components/ui/ErrorToasty'
import useNavigationGuard from '@/hooks/use-navigation-guard'
import {
  useExercise,
  usePatient,
  usePatientSessions,
} from '@virtality/react-query'
import { resolveSavedHeadsetSelection } from '@/lib/patient-dashboard-device-selection'
import {
  canLaunchTreatment,
  getTreatmentLaunchError,
} from '@/lib/patient-dashboard-treatment-launch'
import { useVrHeadsetPresence } from '@/hooks/use-vr-headset-presence'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import {
  resolveCurrentExerciseIndex,
  type SkipDirection,
} from '@/lib/session-exercise-skip'
import { resolveSkipControlUiState } from '@/lib/session-exercise-change-ui'

const useControlPanel = () => {
  const { devices } = useDeviceContext()
  const { state, handler, patientId, currExercise, requestForwardBackSkip } =
    usePatientDashboard()
  const { data: patientSessions } = usePatientSessions({
    input: { where: { patientId } },
  })
  const { data: patient } = usePatient({ patientId })
  const { data: defaultExercises } = useExercise()
  const sessionNumber = patientSessions?.length ?? 0
  const {
    programState,
    selectedMap,
    selectedMode,
    selectedDevice,
    selectedAvatar,
    exercises,
    activeExerciseData,
    pendingExerciseChange,
  } = state

  const {
    setSelectedMode,
    setSelectedDevice,
    setActiveExerciseData,
    setProgramState,
  } = handler
  // const { t } = getClientT(['patient-dashboard', 'common']);

  const { connected } = useSocketConnection({ device: selectedDevice })
  const headsetPresent = useVrHeadsetPresence(selectedDevice)
  const { canLaunchVr } = useLiveEntitlementStanding()
  const treatmentLaunchReady = canLaunchTreatment({
    consoleConnected: connected,
    headsetPresent,
    entitlementAllowsLaunch: canLaunchVr,
  })

  const missingSettings = !selectedAvatar || !selectedMap

  const patientLocalData = useRow('patients', patientId) as PatientLocalData
  const lastPairedDeviceId = useValue('lastPairedDeviceId') as
    | string
    | undefined
  const store = useStore()

  useEffect(() => {
    const { selectedDevice: restoredDevice, shouldClearSavedHeadset } =
      resolveSavedHeadsetSelection(
        devices,
        patientLocalData?.lastHeadset ?? lastPairedDeviceId,
      )

    if (shouldClearSavedHeadset) {
      store?.delCell('patients', patientId, 'lastHeadset')
    }

    if (selectedDevice?.data.id !== restoredDevice?.data.id) {
      setSelectedDevice(restoredDevice)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, patientLocalData, lastPairedDeviceId, selectedDevice])

  const programStart = () => {
    if (!exercises?.length)
      return ErrorToasty('Please select program or use quick start!')

    const launchError = getTreatmentLaunchError({
      consoleConnected: connected,
      headsetPresent,
      entitlementAllowsLaunch: canLaunchVr,
    })
    if (launchError) return ErrorToasty(launchError)

    if (!state.selectedAvatar || !state.selectedMap)
      return toast.error(
        'You need to select both an avatar and map. Find them in Scene Settings.',
      )

    if (state.programState === 'ready') {
      const dispatchedData = exercises.map((ex) => {
        const newEx = {
          id: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          restTime: ex.restTime,
          holdTime: ex.holdTime,
          speed: ex.speed,
          romMode: ex.romMode,
        }
        return newEx
      })

      const payload: ProgramStartPayload = {
        exerciseData: dispatchedData,
        settings: {
          avatarId: selectedAvatar?.id ?? '',
          mapId: selectedMap?.id ?? '',
          sessionNumber,
          language: patient?.language,
        },
      }

      setActiveExerciseData({
        id: exercises[0].exerciseId,
        currentRep: 0,
        currentSet: 1,
        totalReps: dispatchedData[0].reps,
        totalSets: dispatchedData[0].sets,
      })

      setProgramState('launching')
      selectedDevice?.events.program.Start(payload)
    } else {
      selectedDevice?.events.program.Pause()
    }
  }

  const programEnd = () => {
    selectedDevice?.events.program.End()
  }

  const skipExercise = (direction: SkipDirection) => {
    void requestForwardBackSkip(direction)
  }

  const handleWarmupStart = () => {
    if (missingSettings)
      return toast.error(
        'You need to select both an avatar and map. Find them in Scene Settings.',
      )

    const launchError = getTreatmentLaunchError({
      consoleConnected: connected,
      headsetPresent,
      entitlementAllowsLaunch: canLaunchVr,
    })
    if (launchError) return ErrorToasty(launchError)

    const payload = {
      settings: {
        avatarId: selectedAvatar!.id,
        sessionNumber,
        mapId: selectedMap!.id,
      },
    }
    if (programState !== 'started')
      selectedDevice?.events.program.WarmupStart(payload)
    else selectedDevice?.events.program.WarmupEnd()
  }

  const isProgramActive = programState === 'started'
  const isProgramInactive = programState === 'ready'
  const isProgramPaused = programState === 'paused'
  const isProgramLaunching = programState === 'launching'
  const isMain = selectedMode === 'main'
  const currentExerciseIndex = resolveCurrentExerciseIndex({
    exercises,
    activeExerciseId: activeExerciseData.id,
    fallbackIndex: currExercise.current,
  })
  const exerciseCount = exercises?.length ?? 0
  const skipControlState = {
    currentExerciseIndex,
    exerciseCount,
    pendingExerciseChange,
  }
  const forwardSkipControl = resolveSkipControlUiState({
    ...skipControlState,
    direction: 'forward',
  })
  const backSkipControl = resolveSkipControlUiState({
    ...skipControlState,
    direction: 'back',
  })
  const isSkipBlockedByProgramState =
    isProgramInactive || isProgramPaused || isProgramLaunching

  const { GuardDialog } = useNavigationGuard(connected, () => {
    selectedDevice?.socket.disconnect()
  })

  return {
    devices,
    connected,
    selectedMode,
    setSelectedMode,
    programState,
    isProgramPaused,
    isProgramInactive,
    isProgramActive,
    isProgramLaunching,
    treatmentLaunchReady,
    programStart,
    programEnd,
    handleWarmupStart,
    skipExercise,
    forwardSkipControl,
    backSkipControl,
    isSkipBlockedByProgramState,
    isMain,
    activeExerciseData,
    pendingExerciseChange,
    exercises,
    defaultExercises,
    selectedDevice,
    missingSettings,
    GuardDialog,
  }
}

export default useControlPanel
