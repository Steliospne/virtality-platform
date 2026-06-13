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
import { ProgressDataSchema, ProgressData } from '@/lib/definitions'
import { getDisplayName } from '@/lib/utils'
import usePlotData from './use-plot-data'
import { generateUUID } from '@virtality/shared/utils'
import {
  getQueryClient,
  useStartPatientSessionFromAck,
  useUpsertPatientSessionData,
  useInterruptPatientSession,
  useORPC,
} from '@virtality/react-query'
import {
  buildSessionExerciseRowsFromWorkingCopy,
  buildStartedSessionInput,
  canPersistSessionProgress,
  resolveSourceProgramContext,
  shouldCreatePatientSessionOnStartAck,
  type SessionExerciseRowInput,
} from '@/lib/patient-dashboard-session-launch'
import {
  buildCurrentExerciseProgressUpsert,
  buildSessionProgressUpserts,
} from '@/lib/session-progress-persistence'
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
  const currSet = useRef(0)
  const currRep = useRef(0)
  const stats = useRef({ highscore: 0, bestExercise: '' })

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

  const resetSessionState = () => {
    patientSessionId.current = ''
    sessionExerciseRows.current = []
  }

  const persistCurrentExerciseProgress = async () => {
    const sessionExercise = sessionExerciseRows.current[currExercise.current]
    if (
      !canPersistSessionProgress(
        patientSessionId.current,
        sessionExerciseRows.current,
        currExercise.current,
      ) ||
      !sessionExercise
    ) {
      return
    }

    await upsertPatientSessionData([
      buildCurrentExerciseProgressUpsert({
        patientSessionId: patientSessionId.current,
        sessionExercise,
        progressPoints: realTimeData.current,
      }),
    ])
  }

  const handleSessionDataCreation = async () => {
    if (!patientSessionId.current || sessionExerciseRows.current.length === 0) {
      return
    }

    await upsertPatientSessionData(
      buildSessionProgressUpserts({
        patientSessionId: patientSessionId.current,
        sessionExerciseRows: sessionExerciseRows.current,
        progressByExerciseId: progressData.current ?? {},
        currentExerciseIndex: currExercise.current,
        currentExerciseProgress: realTimeData.current,
      }),
    )
  }

  const progressDataClear = () => {
    currSet.current = 0
    const reps = exercises?.[currExercise.current]?.reps ?? 0
    realTimeData.current = Array.from({ length: reps }, (_, i) => ({
      rep: i + 1,
    }))
    setPlotData(realTimeData.current)
  }

  const handlePersistenceFailureAfterStartAck = () => {
    resetSessionState()
    socket?.emit(PROGRAM_EVENT.End)
    selectedDevice?.events.program.End()
    ErrorToasty('Failed to start session. Please try again.')
    setProgramState(ProgramStatus.END)
  }

  const handleStartAck = async () => {
    if (!shouldCreatePatientSessionOnStartAck(programState)) {
      return
    }

    if (!exercises?.length) {
      handlePersistenceFailureAfterStartAck()
      return
    }

    progressDataClear()

    const sessionId = generateUUID()
    const source = resolveSourceProgramContext(inQuickStart, selectedProgram)
    const rows = buildSessionExerciseRowsFromWorkingCopy(exercises, sessionId)

    try {
      await startPatientSessionFromAck({
        session: buildStartedSessionInput({
          sessionId,
          patientId,
          source,
        }),
        exercises: rows,
      })

      patientSessionId.current = sessionId
      sessionExerciseRows.current = rows
      setProgramState(ProgramStatus.START)
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

    await handleSessionDataCreation()

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
    currExercise.current = 0
    await openCompletionDialog()
  }

  const handleEndAck = async () => {
    currExercise.current = 0
    await openCompletionDialog()
  }

  const handleChangeExercise = (data: string) => {
    const nextExercise = exercises?.findIndex((ex) => ex.exerciseId === data)

    if (nextExercise === undefined) {
      throw Error('Error getting next exercise')
    }
    const index = nextExercise + 1

    setActiveExerciseData({
      id: exercises[index].exerciseId,
      currentRep: 0,
      currentSet: 1,
      totalReps: exercises[index].reps,
      totalSets: exercises[index].sets,
    })

    currExercise.current = index
    progressDataClear()
  }

  const handleChangeExerciseAck = () => {
    progressDataClear()
  }

  const handleRepEnd = (payload: string) => {
    if (
      !canPersistSessionProgress(
        patientSessionId.current,
        sessionExerciseRows.current,
        currExercise.current,
      )
    ) {
      return
    }

    const parsedData = JSON.parse(payload) as ProgressData

    const validatedData = ProgressDataSchema.safeParse(parsedData)

    if (validatedData.success) {
      if (stats.current.highscore < parsedData.progress) {
        stats.current.highscore = parsedData.progress
        stats.current.bestExercise =
          getDisplayName(exercises![currExercise.current].exercise) ?? ''
      }

      const prevPlotData = realTimeData.current
      const index = validatedData.data.previousRep
      const set = currSet.current + 1
      const rep = index + 1
      const value = validatedData.data.progress * 100
      currRep.current = index

      const updatedPlotData = [...prevPlotData]
      updatedPlotData[index] = {
        ...updatedPlotData[index],
        rep,
        [`set_${set}`]: value,
      }

      realTimeData.current = updatedPlotData

      setPlotData(updatedPlotData)
      setActiveExerciseData({ ...activeExerciseData, currentRep: rep })
      const prevData = progressData.current
      store?.setCell(
        'patients',
        patientId,
        'progress',
        JSON.stringify({
          ...prevData,
          [exercises![currExercise.current].exerciseId]: updatedPlotData,
        }),
      )

      store?.setCell(
        'patients',
        patientId,
        'highscore',
        stats.current.highscore,
      )
      store?.setCell(
        'patients',
        patientId,
        'bestExercise',
        stats.current.bestExercise,
      )
    } else console.log(validatedData.error.message)
  }

  const handleSetEnd = async (payload: string) => {
    if (
      !canPersistSessionProgress(
        patientSessionId.current,
        sessionExerciseRows.current,
        currExercise.current,
      )
    ) {
      return
    }

    const parsedData = JSON.parse(payload) as { previousSet: number }

    currSet.current = Number(parsedData.previousSet)
    const set = currSet.current
    const rep = currRep.current
    const index = currExercise.current

    setActiveExerciseData({ ...activeExerciseData, currentSet: set + 1 })

    const isLastSet =
      set === exercises![index].sets && rep === exercises![index].reps - 1

    const isLastExercise = index === exercises!.length - 1

    if (isLastSet) {
      progressData.current = {
        ...progressData.current,
        [exercises![index]?.exerciseId]: realTimeData.current,
      }

      if (isLastExercise) {
        currExercise.current = 0
      }
    }

    try {
      await persistCurrentExerciseProgress()
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
      await handleSessionDataCreation()
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

  return patientSessionId
}

export default usePatientDashboardSocketSetup
