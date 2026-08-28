import {
  PatientLocalData,
  ProgramStatus,
  ProgressDataPoint,
} from '@/types/models'
import { subscribe } from '@/lib/device-event-controller'
import {
  PROGRAM_EVENT,
  ROOM_EVENT,
  SYSTEM_EVENT,
} from '@virtality/shared/types'
import { RefObject, useEffect, useRef } from 'react'
import { Store } from 'tinybase'
import useDashboardState from './use-patient-dashboard-state'
import SuccessToasty from '../components/ui/SuccessToasty'
import NotifyDoctorToasty from '../components/ui/NotifyDoctorToasty'
import { getDisplayName } from '@/lib/utils'
import usePlotData from './use-plot-data'
import {
  isDirectExerciseSelectionDisabled,
  type PendingExerciseChange,
  type SkipDirection,
} from '@/lib/session-exercise-skip'
import {
  EXERCISE_CHANGE_ACK_TIMEOUT_MS,
  resolveExerciseChangeFailureMessage,
} from '@/lib/session-exercise-change-ui'
import {
  getQueryClient,
  useStartPatientSessionFromAck,
  useUpsertPatientSessionData,
  useInterruptPatientSession,
  useSyncSessionWorkingCopy,
  useORPC,
} from '@virtality/react-query'
import {
  buildStartAckPersistenceInput,
  canPersistSessionProgress,
  resolveProgramStateAfterStartAckPersistenceFailure,
  resolveProgramStateAfterStartAckPersistenceSuccess,
  shouldCreatePatientSessionOnStartAck,
  type SessionExerciseRowInput,
} from '@/lib/patient-dashboard-session-launch'
import type { SessionProgressUpsertInput } from '@/lib/session-progress-persistence'
import {
  acknowledgeExerciseChangeInFlow,
  applyHeadsetExerciseAdvanceInFlow,
  applyRepEndToFlow,
  applySetEndToFlow,
  completeSessionInFlow,
  failPendingExerciseChangeInFlow,
  interruptSessionInFlow,
  requestExerciseSkipInFlow,
  type ExerciseSkipRequest,
  type SkipSafeProgressFlowState,
} from '@/lib/skip-safe-progress-flow'
import {
  buildSessionWorkingCopySyncPayload,
  serializeSessionWorkingCopy,
  shouldPersistSessionWorkingCopy,
} from '@/lib/session-working-copy-sync'
import { generateUUID } from '@virtality/shared/utils'
import ErrorToasty from '../components/ui/ErrorToasty'

type ProgressDataPerExercise = {
  [key: string]: ProgressDataPoint[]
}

interface usePatientDashboardSocketSetupProps {
  state: ReturnType<typeof useDashboardState>['state']
  handler: ReturnType<typeof useDashboardState>['handler']
  patientId: string
  store?: Store
  currExercise: RefObject<number>
  patientLocalData: PatientLocalData
  plot: ReturnType<typeof usePlotData>
}

const usePatientDashboardSocketSetup = ({
  state,
  handler,
  patientId,
  store,
  currExercise,
  plot,
}: usePatientDashboardSocketSetupProps) => {
  const queryClient = getQueryClient()
  const orpc = useORPC()

  const {
    selectedProgram,
    programState,
    isDialogOpen,
    exercises,
    selectedDevice,
    activeExerciseData,
    inQuickStart,
  } = state

  const {
    setProgramState,
    setActiveExerciseData,
    updatePatientDashboardState,
  } = handler

  const { setPlotData } = plot.handler
  const socket = selectedDevice?.socket
  const progressData = useRef<ProgressDataPerExercise | null>(null)
  const realTimeData = useRef<ProgressDataPoint[]>([])
  const patientSessionId = useRef('')
  const sessionExerciseRows = useRef<SessionExerciseRowInput[]>([])
  const lastSyncedWorkingCopy = useRef<string | null>(null)
  const currSet = useRef(0)
  const currRep = useRef(0)
  const stats = useRef({ highscore: 0, bestExercise: '' })
  const pendingExerciseChange = useRef<PendingExerciseChange | null>(null)
  const pendingExerciseChangeTimeout = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  const invalidatePatientSessions = async () =>
    await queryClient.invalidateQueries({
      queryKey: orpc.patientSession.list.queryKey({
        input: { where: { patientId } },
      }),
    })

  const { mutateAsync: upsertPatientSessionData } = useUpsertPatientSessionData(
    {
      onSuccess: invalidatePatientSessions,
    },
  )

  const { mutateAsync: startPatientSessionFromAck } =
    useStartPatientSessionFromAck({
      onSuccess: invalidatePatientSessions,
    })

  const { mutateAsync: interruptPatientSession } = useInterruptPatientSession({
    onSuccess: invalidatePatientSessions,
  })

  const { mutateAsync: syncSessionWorkingCopy } = useSyncSessionWorkingCopy()

  const resetSessionState = () => {
    patientSessionId.current = ''
    sessionExerciseRows.current = []
    lastSyncedWorkingCopy.current = null
    clearPendingExerciseChange()
  }

  const clearPendingExerciseChangeTimeout = () => {
    if (pendingExerciseChangeTimeout.current) {
      clearTimeout(pendingExerciseChangeTimeout.current)
      pendingExerciseChangeTimeout.current = null
    }
  }

  const readFlowState = (): SkipSafeProgressFlowState => ({
    patientSessionId: patientSessionId.current,
    sessionExerciseRows: sessionExerciseRows.current,
    headsetConfirmedExerciseIndex: currExercise.current,
    pendingExerciseChange: pendingExerciseChange.current,
    progressByExerciseId: progressData.current ?? {},
    currentExerciseProgress: realTimeData.current,
    currSet: currSet.current,
    currRep: currRep.current,
  })

  const writeFlowState = (next: SkipSafeProgressFlowState) => {
    patientSessionId.current = next.patientSessionId
    sessionExerciseRows.current = [...next.sessionExerciseRows]
    currExercise.current = next.headsetConfirmedExerciseIndex
    pendingExerciseChange.current = next.pendingExerciseChange
    progressData.current = { ...next.progressByExerciseId }
    realTimeData.current = [...next.currentExerciseProgress]
    currSet.current = next.currSet
    currRep.current = next.currRep
  }

  const canPersistFlowState = (state: SkipSafeProgressFlowState) =>
    canPersistSessionProgress(
      state.patientSessionId,
      state.sessionExerciseRows,
      state.headsetConfirmedExerciseIndex,
    )

  const persistRemoteUpserts = async (
    remoteUpserts: SessionProgressUpsertInput[],
  ) => {
    if (remoteUpserts.length === 0) {
      return
    }

    await upsertPatientSessionData(remoteUpserts)
  }

  const syncPendingExerciseChangeUi = (
    change: PendingExerciseChange | null,
  ) => {
    updatePatientDashboardState({ pendingExerciseChange: change })
  }

  const clearPendingExerciseChange = () => {
    clearPendingExerciseChangeTimeout()
    pendingExerciseChange.current = null
    syncPendingExerciseChangeUi(null)
  }

  const handlePendingExerciseChangeFailure = () => {
    const pending = pendingExerciseChange.current

    if (!pending) {
      return
    }

    const result = failPendingExerciseChangeInFlow(readFlowState())

    if (!result.failed) {
      return
    }

    const sourceExercise = exercises?.[pending.sourceExerciseIndex]
    const confirmedExerciseName =
      getDisplayName(sourceExercise?.exercise) ?? 'Current exercise'

    writeFlowState(result.state)
    clearPendingExerciseChange()
    ErrorToasty(resolveExerciseChangeFailureMessage(confirmedExerciseName))
  }

  const setPendingExerciseChangeTimeout = () => {
    clearPendingExerciseChangeTimeout()
    pendingExerciseChangeTimeout.current = setTimeout(() => {
      handlePendingExerciseChangeFailure()
    }, EXERCISE_CHANGE_ACK_TIMEOUT_MS)
  }

  const applyExerciseAtIndex = (index: number) => {
    const exercise = exercises?.[index]

    if (!exercise) {
      return
    }

    currExercise.current = index
    setActiveExerciseData({
      id: exercise.exerciseId,
      currentRep: 0,
      currentSet: 1,
      totalReps: exercise.reps,
      totalSets: exercise.sets,
    })
  }

  const syncPlotFromFlowState = (next: SkipSafeProgressFlowState) => {
    setPlotData([...next.currentExerciseProgress])
  }

  const progressDataClear = () => {
    currSet.current = 0
    currRep.current = 0
    const reps = exercises?.[currExercise.current]?.reps ?? 0
    realTimeData.current = Array.from({ length: reps }, (_, i) => ({
      rep: i + 1,
    }))
    setPlotData(realTimeData.current)
  }

  const canRequestExerciseSkip = () =>
    programState === 'started' &&
    Boolean(exercises?.length) &&
    !isDirectExerciseSelectionDisabled({
      pendingExerciseChange: pendingExerciseChange.current,
    })

  const requestExerciseSkip = async (request: ExerciseSkipRequest) => {
    if (!canRequestExerciseSkip()) {
      return
    }

    const flowState = readFlowState()
    const result = requestExerciseSkipInFlow(flowState, request, {
      persistSucceeds: canPersistFlowState(flowState),
    })

    if (!result.skipRequested || !result.state.pendingExerciseChange) {
      return
    }

    writeFlowState(result.state)
    syncPendingExerciseChangeUi(result.state.pendingExerciseChange)
    setPendingExerciseChangeTimeout()
    try {
      await persistRemoteUpserts(result.remoteUpserts)
    } catch (error) {
      console.error(error)
    }

    const targetExercise =
      exercises[result.state.pendingExerciseChange.targetExerciseIndex]
    if (targetExercise) {
      selectedDevice?.events.program.ChangeExercise(targetExercise.exerciseId)
    }
  }

  const requestForwardBackSkip = async (direction: SkipDirection) => {
    await requestExerciseSkip({ kind: direction })
  }

  const requestDirectExerciseSelection = async (targetIndex: number) => {
    await requestExerciseSkip({
      kind: 'direct',
      targetExerciseIndex: targetIndex,
    })
  }

  const handlePersistenceFailureAfterStartAck = () => {
    resetSessionState()
    socket?.emit(PROGRAM_EVENT.End)
    selectedDevice?.events.program.End()
    ErrorToasty('Failed to start session. Please try again.')
    setProgramState(resolveProgramStateAfterStartAckPersistenceFailure())
  }

  const handleStartAck = async () => {
    if (!shouldCreatePatientSessionOnStartAck(programState)) {
      return
    }

    const persistenceInput = buildStartAckPersistenceInput({
      programState,
      exercises,
      patientId,
      inQuickStart,
      selectedProgram,
    })

    if (!persistenceInput) {
      handlePersistenceFailureAfterStartAck()
      return
    }

    progressDataClear()

    try {
      await startPatientSessionFromAck({
        session: persistenceInput.session,
        exercises: persistenceInput.exercises,
      })

      patientSessionId.current = persistenceInput.sessionId
      sessionExerciseRows.current = persistenceInput.exercises
      lastSyncedWorkingCopy.current = serializeSessionWorkingCopy(exercises)
      setProgramState(resolveProgramStateAfterStartAckPersistenceSuccess())
    } catch (error) {
      console.error(error)
      handlePersistenceFailureAfterStartAck()
    }
  }

  const handlePauseAck = () => {
    if (programState === 'started') {
      setProgramState(ProgramStatus.PAUSE)
    } else {
      setProgramState(ProgramStatus.START)
    }
  }

  const openCompletionDialog = async () => {
    const sessionIdForCompletion = patientSessionId.current

    if (sessionIdForCompletion && sessionExerciseRows.current.length > 0) {
      const result = completeSessionInFlow(readFlowState())
      await persistRemoteUpserts(result.remoteUpserts)
      writeFlowState(result.state)
    }

    resetSessionState()
    updatePatientDashboardState({
      programState: ProgramStatus.END,
      completionSessionId: sessionIdForCompletion || null,
      isDialogOpen: true,
      activeExerciseData: {
        ...activeExerciseData,
        currentRep: 0,
        currentSet: 0,
        totalReps: 0,
        totalSets: 0,
      },
    })
  }

  const handleEnd = async () => {
    socket?.emit(PROGRAM_EVENT.EndAck)
    await openCompletionDialog()
  }

  const handleEndAck = async () => {
    await openCompletionDialog()
  }

  const handleChangeExercise = (data: string) => {
    const result = applyHeadsetExerciseAdvanceInFlow(readFlowState(), data)

    if (!result.advanced) {
      return
    }

    writeFlowState(result.state)
    applyExerciseAtIndex(result.state.headsetConfirmedExerciseIndex)
    syncPlotFromFlowState(result.state)
  }

  const handleChangeExerciseAck = () => {
    const result = acknowledgeExerciseChangeInFlow(readFlowState())

    if (!result.acknowledged) {
      return
    }

    writeFlowState(result.state)
    clearPendingExerciseChange()
    applyExerciseAtIndex(result.state.headsetConfirmedExerciseIndex)
    syncPlotFromFlowState(result.state)
  }

  const handleRepEnd = (payload: string) => {
    const flowState = readFlowState()

    if (!canPersistFlowState(flowState)) {
      return
    }

    const result = applyRepEndToFlow(flowState, payload)

    if (result.completedRep === undefined) {
      return
    }

    const currentExercise = exercises![currExercise.current]
    const progress = result.progress ?? 0

    if (stats.current.highscore < progress) {
      stats.current.highscore = progress
      stats.current.bestExercise =
        getDisplayName(currentExercise.exercise) ?? ''
    }

    writeFlowState(result.state)
    syncPlotFromFlowState(result.state)
    setActiveExerciseData({
      ...activeExerciseData,
      currentRep: result.completedRep,
    })

    const prevData = progressData.current
    store?.setCell(
      'patients',
      patientId,
      'progress',
      JSON.stringify({
        ...prevData,
        [currentExercise.exerciseId]: result.state.currentExerciseProgress,
      }),
    )

    store?.setCell('patients', patientId, 'highscore', stats.current.highscore)
    store?.setCell(
      'patients',
      patientId,
      'bestExercise',
      stats.current.bestExercise,
    )
  }

  const handleSetEnd = async (payload: string) => {
    const flowState = readFlowState()

    if (!canPersistFlowState(flowState)) {
      return
    }

    const result = applySetEndToFlow(flowState, payload)

    if (result.state === flowState) {
      return
    }

    writeFlowState(result.state)
    setActiveExerciseData({
      ...activeExerciseData,
      currentSet: result.state.currSet + 1,
    })

    if (result.advancedToNextExercise) {
      applyExerciseAtIndex(result.state.headsetConfirmedExerciseIndex)
      syncPlotFromFlowState(result.state)
    }

    try {
      await persistRemoteUpserts(result.remoteUpserts)
    } catch (error) {
      console.error(error)
    }
  }

  const handleWarmupStartAck = () => {
    setProgramState(ProgramStatus.START)
  }

  const handleWarmupEndAck = () => {
    setProgramState(ProgramStatus.END)
  }

  const handleCalibrateHeightAck = () => {
    SuccessToasty('Height calibrated successfully.')
  }

  const handleResetPositionAck = () => {
    SuccessToasty('Position reset successfully.')
  }

  const handleSettingsChangeAck = () => {
    SuccessToasty('Settings changed successfully.')
  }

  const handleNotifyDoctor = () => {
    NotifyDoctorToasty('Patient needs attention')
  }

  const handleUnexpectedSessionEnd = async () => {
    const sessionId = patientSessionId.current

    if (!sessionId) {
      setProgramState(ProgramStatus.END)
      return
    }

    try {
      const result = interruptSessionInFlow(readFlowState())
      await persistRemoteUpserts(result.remoteUpserts)
      writeFlowState(result.state)
      await interruptPatientSession({ id: sessionId })
      ErrorToasty('Session was interrupted before completion.')
    } catch (error) {
      console.error(error)
      ErrorToasty('Failed to save interrupted session progress.')
    } finally {
      currExercise.current = 0
      resetSessionState()
      updatePatientDashboardState({
        programState: ProgramStatus.END,
        completionSessionId: null,
        isDialogOpen: false,
        activeExerciseData: {
          ...activeExerciseData,
          currentRep: 0,
          currentSet: 0,
          totalReps: 0,
          totalSets: 0,
        },
      })
    }
  }

  const memberLeft = async () => {
    await handleUnexpectedSessionEnd()
  }

  useEffect(() => {
    if (
      !shouldPersistSessionWorkingCopy(
        programState,
        patientSessionId.current,
        exercises,
      )
    ) {
      return
    }

    const serializedWorkingCopy = serializeSessionWorkingCopy(exercises)
    if (serializedWorkingCopy === lastSyncedWorkingCopy.current) {
      return
    }

    const payload = buildSessionWorkingCopySyncPayload({
      sessionId: patientSessionId.current,
      exercises,
      persistedRows: sessionExerciseRows.current,
      createId: generateUUID,
    })

    void syncSessionWorkingCopy(payload)
      .then((result) => {
        sessionExerciseRows.current = result.exercises.map((exercise) => ({
          ...exercise,
          patientSessionId: patientSessionId.current,
        }))
        lastSyncedWorkingCopy.current = serializedWorkingCopy
      })
      .catch((error) => {
        console.error(error)
      })
  }, [exercises, programState, syncSessionWorkingCopy])

  useEffect(() => {
    if (!socket) return

    return subscribe(
      socket,
      { ...PROGRAM_EVENT, ...ROOM_EVENT, ...SYSTEM_EVENT },
      {
        // PROGRAM_EVENT
        StartAck: handleStartAck,
        PauseAck: handlePauseAck,
        End: handleEnd,
        EndAck: handleEndAck,
        ChangeExercise: handleChangeExercise,
        ChangeExerciseAck: handleChangeExerciseAck,
        RepEnd: handleRepEnd,
        SetEnd: handleSetEnd,
        WarmupStartAck: handleWarmupStartAck,
        WarmupEndAck: handleWarmupEndAck,
        CalibrateHeightAck: handleCalibrateHeightAck,
        ResetPositionAck: handleResetPositionAck,
        SettingsChangeAck: handleSettingsChangeAck,

        // ROOM_EVENT
        MemberLeft: memberLeft,

        // SYSTEM_EVENT
        NotifyDoctor: handleNotifyDoctor,
      },
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, socket])

  return {
    patientSessionId,
    requestForwardBackSkip,
    requestDirectExerciseSelection,
  }
}

export default usePatientDashboardSocketSetup
