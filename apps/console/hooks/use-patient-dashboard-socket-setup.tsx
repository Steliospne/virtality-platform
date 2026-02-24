import {
  PatientLocalData,
  PROGRAM_EVENT,
  ProgramStatus,
  ProgressData,
  ProgressDataPoint,
  ROOM_EVENT,
  SYSTEM_EVENT,
} from '@/types/models'
import { RefObject, useEffect, useRef } from 'react'
import { Store } from 'tinybase'
import useDashboardState from './use-patient-dashboard-state'
import SuccessToasty from '../components/ui/SuccessToasty'
import NotifyDoctorToasty from '../components/ui/NotifyDoctorToasty'
import { ProgressDataSchema } from '@/lib/definitions'
import { getDisplayName, getUUID } from '@/lib/utils'
import usePlotData from './use-plot-data'
import { PatientSession } from '@virtality/db'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import useCreatePatientSessionData from './mutations/patient-session-data/use-create-patient-session-data'
import useCreatePatientSessionExercises from './mutations/patient-session-exercise/use-create-patient-session-exercises'
import { orpc } from '@/integrations/orpc/client'
import useCreatePatientSession from './mutations/patient-session/use-create-patient-session'
import { generateUUID } from '@virtality/shared/utils'

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
  const { queryClient } = getQueryClient()

  const {
    selectedProgram,
    programState,
    isDialogOpen,
    exercises,
    selectedDevice,
    activeExerciseData,
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
  const currSet = useRef(0)
  const currRep = useRef(0)
  const stats = useRef({ highscore: 0, bestExercise: '' })

  const { mutateAsync: createPatientSessionData } = useCreatePatientSessionData(
    {
      onSuccess: async () =>
        await queryClient.invalidateQueries({
          queryKey: orpc.patientSession.list.queryKey({
            input: { where: { patientId } },
          }),
        }),
    },
  )

  const { mutateAsync: createPatientSessionExercises } =
    useCreatePatientSessionExercises({})

  const { mutate: createPatientSession } = useCreatePatientSession({})

  const handleSessionDataCreation = async () => {
    const sessionExercises = exercises!.map((ex) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets,
      reps: ex.reps,
      restTime: ex.restTime,
      holdTime: ex.holdTime,
      speed: ex.speed,
      patientSessionId: patientSessionId.current,
    }))

    const sessionExerciseIds = await createPatientSessionExercises({
      patientSessionId: patientSessionId.current,
      exercises: sessionExercises,
    })

    const data = sessionExercises.map((sessionExercise, index) => ({
      id: getUUID(),
      patientSessionId: patientSessionId.current,
      sessionExerciseId: sessionExerciseIds[index],
      value: JSON.stringify(
        progressData.current?.[sessionExercise.exerciseId] || [],
      ),
    }))

    await createPatientSessionData(data)
  }

  const progressDataClear = () => {
    currSet.current = 0
    const reps = exercises?.[currExercise.current]?.reps ?? 0
    realTimeData.current = Array.from({ length: reps }, (_, i) => ({
      rep: i + 1,
    }))
    setPlotData(realTimeData.current)
  }

  const handleStartAck = () => {
    progressDataClear()
    setProgramState(ProgramStatus.START)

    const newSession: PatientSession = {
      id: generateUUID(),
      patientId,
      programId: selectedProgram ? selectedProgram.id : null,
      nprs: null,
      notes: null,
      createdAt: new Date(),
      completedAt: null,
      deletedAt: null,
    }

    createPatientSession(newSession)

    patientSessionId.current = newSession.id
  }

  const handlePauseAck = () => {
    if (programState === 'started') {
      setProgramState(ProgramStatus.PAUSE)
    } else {
      setProgramState(ProgramStatus.START)
    }
  }

  const handleEnd = async () => {
    socket?.emit(PROGRAM_EVENT.EndAck)
    currExercise.current = 0

    await handleSessionDataCreation()

    updatePatientDashboardState({
      programState: ProgramStatus.END,
      isDialogOpen: !isDialogOpen,
      activeExerciseData: {
        currentRep: 0,
        currentSet: 0,
        totalReps: 0,
        totalSets: 0,
      },
    })
  }

  const handleEndAck = async () => {
    currExercise.current = 0

    await handleSessionDataCreation()

    updatePatientDashboardState({
      programState: ProgramStatus.END,
      isDialogOpen: !isDialogOpen,
      activeExerciseData: {
        currentRep: 0,
        currentSet: 0,
        totalReps: 0,
        totalSets: 0,
      },
    })
  }

  const handleChangeExercise = (data: string) => {
    const nextExercise = exercises?.findIndex((ex) => ex.exerciseId === data)

    if (nextExercise === undefined) {
      throw Error('Error getting next exercise')
    }
    const index = nextExercise + 1

    setActiveExerciseData({
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

  const handleSetEnd = (payload: string) => {
    const parsedData = JSON.parse(payload) as { previousSet: number }
    // currSet.current = Number(parsedData.previousSet) + 1;

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

  const memberLeft = async () => {
    currExercise.current = 0
    if (patientSessionId.current !== '') {
      try {
        await handleSessionDataCreation()

        updatePatientDashboardState({
          programState: ProgramStatus.END,
          isDialogOpen: !isDialogOpen,
        })
      } catch (error) {
        console.log(error)
        throw Error('Error creating session data.')
      }
    } else {
      setProgramState(ProgramStatus.END)
    }
  }

  useEffect(() => {
    socket?.on(PROGRAM_EVENT.StartAck, handleStartAck)
    socket?.on(PROGRAM_EVENT.PauseAck, handlePauseAck)
    socket?.on(PROGRAM_EVENT.End, handleEnd)
    socket?.on(PROGRAM_EVENT.EndAck, handleEndAck)
    socket?.on(PROGRAM_EVENT.ChangeExercise, handleChangeExercise)
    socket?.on(PROGRAM_EVENT.ChangeExerciseAck, handleChangeExerciseAck)
    socket?.on(PROGRAM_EVENT.RepEnd, handleRepEnd)
    socket?.on(PROGRAM_EVENT.SetEnd, handleSetEnd)
    socket?.on(PROGRAM_EVENT.WarmupStartAck, handleWarmupStartAck)
    socket?.on(PROGRAM_EVENT.WarmupEndAck, handleWarmupEndAck)
    socket?.on(PROGRAM_EVENT.CalibrateHeightAck, handleCalibrateHeightAck)
    socket?.on(PROGRAM_EVENT.ResetPositionAck, handleResetPositionAck)
    socket?.on(PROGRAM_EVENT.SettingsChangeAck, handleSettingsChangeAck)
    socket?.on(ROOM_EVENT.MemberLeft, memberLeft)
    socket?.on(SYSTEM_EVENT.NotifyDoctor, handleNotifyDoctor)

    return () => {
      socket?.off(PROGRAM_EVENT.StartAck, handleStartAck)
      socket?.off(PROGRAM_EVENT.PauseAck, handlePauseAck)
      socket?.off(PROGRAM_EVENT.End, handleEnd)
      socket?.off(PROGRAM_EVENT.EndAck, handleEndAck)
      socket?.off(PROGRAM_EVENT.ChangeExercise, handleChangeExercise)
      socket?.off(PROGRAM_EVENT.ChangeExerciseAck, handleChangeExerciseAck)
      socket?.off(PROGRAM_EVENT.RepEnd, handleRepEnd)
      socket?.off(PROGRAM_EVENT.SetEnd, handleSetEnd)
      socket?.off(PROGRAM_EVENT.WarmupStartAck, handleWarmupStartAck)
      socket?.off(PROGRAM_EVENT.WarmupEndAck, handleWarmupEndAck)
      socket?.off(PROGRAM_EVENT.CalibrateHeightAck, handleCalibrateHeightAck)
      socket?.off(PROGRAM_EVENT.ResetPositionAck, handleResetPositionAck)
      socket?.off(PROGRAM_EVENT.SettingsChangeAck, handleSettingsChangeAck)
      socket?.off(ROOM_EVENT.MemberLeft, memberLeft)
      socket?.off(SYSTEM_EVENT.NotifyDoctor, handleNotifyDoctor)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, socket])

  return patientSessionId
}

export default usePatientDashboardSocketSetup
