import { useEffect, useState, MouseEvent, useRef } from 'react'
import {
  CircleAlert,
  PauseCircle,
  PlayCircle,
  RectangleGoggles,
  Settings,
  SkipBack,
  SkipForward,
  StopCircle,
  X,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import MapSelector from './map-selector'
import AvatarSelector from './avatar-selector'
import {
  PatientDashboardValue,
  usePatientDashboard,
} from '@/context/patient-dashboard-context'
import { Button } from '@/components/ui/button'
import { Id, toast } from 'react-toastify'
// import { getClientT } from '@/i18n/get-client-t';
import VRControlPanel from '@/components/ui/vr-control-panel'
import useSocketConnection from '@/hooks/use-socket-connection'
import { cn } from '@/lib/utils'
import { DeviceContextValue, useDeviceContext } from '@/context/device-context'
import { useRow } from 'tinybase/ui-react'
import {
  PatientLocalData,
  PROGRAM_EVENT,
  ProgramStartPayload,
} from '@/types/models'
import ErrorToasty from '@/components/ui/ErrorToasty'
import useNavigationGuard from '@/hooks/use-navigation-guard'
import ProgramSelector from './program-selector'
import { Item } from '@/components/ui/item'
import usePatient from '@/hooks/queries/patient/use-patient'
import usePatientSessions from '@/hooks/queries/patient-session/use-patient-sessions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

let wakeLock: WakeLockSentinel | null = null

const ControlPanel = ({ className }: { className?: string }) => {
  const { devices } = useDeviceContext()
  const { state, handler, patientId, currExercise } = usePatientDashboard()
  const { data: patientSessions } = usePatientSessions({
    input: { where: { patientId } },
  })
  const { data: patient } = usePatient({ patientId })
  const sessionNumber = patientSessions?.length ?? 0
  const {
    programState,
    selectedMap,
    selectedMode,
    selectedDevice,
    selectedAvatar,
    exercises,
    activeExerciseData,
  } = state

  const { setSelectedMode, setSelectedDevice, setActiveExerciseData } = handler
  // const { t } = getClientT(['patient-dashboard', 'common']);

  const connected = useSocketConnection({ device: selectedDevice })

  const missingSettings = !selectedAvatar || !selectedMap

  const patientLocalData = useRow('patients', patientId) as PatientLocalData

  useEffect(() => {
    const newDevice =
      devices?.find(
        (device) => device.data.id === patientLocalData?.lastHeadset,
      ) ?? null

    if (selectedDevice?.data.id !== newDevice?.data.id) {
      setSelectedDevice(newDevice)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, patientLocalData, selectedDevice])

  const programStart = () => {
    if (!exercises)
      return ErrorToasty('Please select program or use quick start!')

    if (!connected) return ErrorToasty('Please connect with a device!')

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
        currentRep: 0,
        currentSet: 1,
        totalReps: dispatchedData[0].reps,
        totalSets: dispatchedData[0].sets,
      })

      selectedDevice?.events.programStart(payload)
    } else {
      selectedDevice?.events.programPause()
    }
  }

  const programEnd = () => {
    selectedDevice?.events.programEnd()
  }

  const skipExercise = (e: MouseEvent) => {
    if (!exercises) return
    const skipDirection = e.currentTarget.id

    let nextExercise = currExercise.current
    switch (skipDirection) {
      case 'back':
        if (nextExercise === 0) {
          nextExercise = exercises.length - 1
          break
        }
        nextExercise--
        break
      case 'forward':
        if (nextExercise === exercises.length - 1) {
          nextExercise = 0
          break
        }
        nextExercise++
        break
      default:
        break
    }
    currExercise.current = nextExercise
    const payload = exercises[nextExercise].exerciseId
    selectedDevice?.events.changeExercise(payload)
    setActiveExerciseData({
      currentRep: 0,
      currentSet: 1,
      totalReps: exercises[nextExercise].reps,
      totalSets: exercises[nextExercise].sets,
    })
  }

  const handleWarmupStart = () => {
    if (missingSettings)
      return toast.error(
        'You need to select both an avatar and map. Find them in Scene Settings.',
      )

    const payload = {
      settings: {
        avatarId: selectedAvatar!.id,
        sessionNumber,
        mapId: selectedMap!.id,
      },
    }
    if (programState !== 'started') selectedDevice?.events.startWarmup(payload)
    else selectedDevice?.events.endWarmup()
  }

  const isProgramActive = programState === 'started'
  const isProgramInactive = programState === 'ready'
  const isProgramPaused = programState === 'paused'
  const isMain = selectedMode === 'main'

  const { GuardDialog } = useNavigationGuard(connected ? true : false, () => {
    selectedDevice?.socket.disconnect()
  })

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Controls */}
      <div className='bg-card flex w-fit items-center gap-2 rounded-xl'>
        <ModeSelector
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          programState={programState}
        />
        <Separator orientation='vertical' className='h-8!' />
        <Controls
          selectedMode={selectedMode}
          isProgramPaused={isProgramPaused}
          isProgramInactive={isProgramInactive}
          isProgramActive={isProgramActive}
          programStart={programStart}
          programEnd={programEnd}
          handleWarmupStart={handleWarmupStart}
          skipExercise={skipExercise}
        />
        <Separator orientation='vertical' className='h-8!' />
      </div>

      <div className='flex flex-1 gap-2'>
        {(isProgramActive || isProgramPaused) && isMain && (
          <>
            <Item variant='outline' size='sm' className='max-h-9 p-1'>
              {`Sets: ${activeExerciseData.currentSet} / ${activeExerciseData.totalSets}`}
            </Item>
            <Item variant='outline' size='sm' className='max-h-9 p-1'>
              {`Reps: ${activeExerciseData.currentRep} / ${activeExerciseData.totalReps}`}
            </Item>
          </>
        )}

        <DeviceSelector devices={devices} connected={connected} />

        {isProgramInactive && isMain && <ProgramSelector className='flex-1' />}

        <SceneSettings
          selectedDevice={selectedDevice}
          missingSettings={missingSettings}
        />
      </div>

      <GuardDialog
        title='Active connection'
        description='You have an active connection navigating to an other page will disconnect the device. Are you sure you want to leave this page?'
      />
    </div>
  )
}

export default ControlPanel

const Controls = ({
  selectedMode,
  isProgramPaused,
  isProgramInactive,
  isProgramActive,
  programStart,
  programEnd,
  skipExercise,
  handleWarmupStart,
}: {
  selectedMode: PatientDashboardValue['state']['selectedMode']
  isProgramPaused: boolean
  isProgramInactive: boolean
  isProgramActive: boolean
  programStart: () => Id | undefined
  programEnd: () => void
  handleWarmupStart: () => Id | undefined
  skipExercise: (e: MouseEvent) => void
}) => {
  const StartProgramButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const buttonRef = StartProgramButton.current

    const keepScreenAwake = async () => {
      if ('wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen')
      }
    }

    if (buttonRef) {
      buttonRef.addEventListener('click', keepScreenAwake)
    }

    return () => {
      if (buttonRef) {
        buttonRef.removeEventListener('click', keepScreenAwake)
      }
    }
  }, [])

  switch (selectedMode) {
    case 'main':
      return (
        <>
          <Button
            disabled={isProgramInactive || isProgramPaused}
            id='back'
            size='icon'
            variant='outline'
            onClick={skipExercise}
          >
            <SkipBack />
          </Button>

          <Button
            ref={StartProgramButton}
            variant='primary'
            size='icon'
            onClick={programStart}
          >
            {isProgramInactive || isProgramPaused ? (
              <PlayCircle className='size-6' />
            ) : (
              <PauseCircle className='size-6' />
            )}
          </Button>

          {(isProgramActive || isProgramPaused) && (
            <Button onClick={programEnd} size='icon' variant='destructive'>
              <StopCircle className='size-6' />
            </Button>
          )}

          <Button
            disabled={isProgramInactive || isProgramPaused} //Temporarily until the VR issue is fixed.
            id='forward'
            size='icon'
            variant='outline'
            onClick={skipExercise}
          >
            <SkipForward />
          </Button>
        </>
      )

    case 'free':
      return (
        <>
          <Button
            ref={StartProgramButton}
            variant={isProgramInactive ? 'primary' : 'destructive'}
            size='icon'
            onClick={handleWarmupStart}
          >
            {isProgramInactive ? (
              <PlayCircle className='size-6' />
            ) : (
              <StopCircle className='size-6' />
            )}
          </Button>
        </>
      )

    default:
      return null
  }
}

const ModeSelector = ({
  selectedMode,
  setSelectedMode,
  programState,
}: {
  selectedMode: PatientDashboardValue['state']['selectedMode']
  setSelectedMode: PatientDashboardValue['handler']['setSelectedMode']
  programState: PatientDashboardValue['state']['programState']
}) => {
  const isProgramActive = programState === 'started'
  const isProgramPaused = programState === 'paused'

  return (
    <Select value={selectedMode} onValueChange={setSelectedMode}>
      <SelectTrigger
        disabled={isProgramActive || isProgramPaused}
        className='border dark:border-zinc-600 dark:bg-zinc-900'
      >
        <SelectValue placeholder='Choose Mode...' />
      </SelectTrigger>
      <SelectContent className='dark:bg-zinc-900'>
        <SelectItem key='main' value='main'>
          Normal Mode
        </SelectItem>
        <SelectItem key='free' value='free'>
          Free Mode
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

const SceneSettings = ({
  missingSettings,
  selectedDevice,
}: {
  missingSettings: boolean
  selectedDevice: PatientDashboardValue['state']['selectedDevice']
}) => {
  const [openSceneSettings, setOpenSceneSettings] = useState(false)
  const [isSitting, setSitting] = useState(false)

  const handleCalibrateHeight = () => {
    selectedDevice?.events.calibrateHeight()
  }

  const handleResetPosition = () => {
    selectedDevice?.events.resetPosition()
  }

  const handleScenePopover = () => {
    setOpenSceneSettings(!openSceneSettings)
  }

  const sittingChangeHandler = (value: boolean) => {
    sittingChangeSocketHandler(value)
  }

  const sittingChangeSocketHandler = (payload: boolean) => {
    selectedDevice?.events.sittingChange(payload)
  }

  const sittingChangeAckSocketHandler = () => {
    setSitting(!isSitting)
  }

  useEffect(() => {
    const socket = selectedDevice?.socket
    if (!socket) return
    socket.on(PROGRAM_EVENT.SittingChange, sittingChangeSocketHandler)
    socket.on(PROGRAM_EVENT.SittingChangeAck, sittingChangeAckSocketHandler)

    return () => {
      socket.off(PROGRAM_EVENT.SittingChange, sittingChangeSocketHandler)
      socket.off(PROGRAM_EVENT.SittingChangeAck, sittingChangeAckSocketHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice])

  return (
    <Popover open={openSceneSettings} onOpenChange={setOpenSceneSettings}>
      <PopoverTrigger asChild>
        <Button className='relative'>
          {missingSettings && (
            <CircleAlert className='bg-card absolute -top-1.5 -right-1.5 rounded-full text-amber-600' />
          )}
          <span className='max-lg:hidden'>Scene Settings</span>
          <Settings className='hidden max-lg:block' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='center' side='bottom'>
        <div className='flex w-full'>
          <Button
            size='icon'
            variant='ghost'
            onClick={handleScenePopover}
            className='ml-auto size-6'
          >
            <X />
          </Button>
        </div>
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2 py-2'>
            <Button onClick={handleCalibrateHeight} className='flex-1'>
              Reset Height
            </Button>
            <Button onClick={handleResetPosition} className='flex-1'>
              Reset Position
            </Button>
          </div>
          <div className='flex gap-3'>
            <Switch
              id='sitting'
              checked={isSitting}
              onCheckedChange={sittingChangeHandler}
            />
            <Label htmlFor='sitting'>Sitting</Label>
          </div>
          <h4>Avatar</h4>
          <Separator className='dark:bg-zinc-600' />
          <AvatarSelector />
          <h4>Map</h4>
          <Separator className='dark:bg-zinc-600' />
          <MapSelector />
        </div>
        <PopoverArrow className='fill-zinc-200 dark:fill-zinc-900' />
      </PopoverContent>
    </Popover>
  )
}

const DeviceSelector = ({
  devices,
  connected,
}: {
  devices: DeviceContextValue['devices']
  connected: boolean
}) => {
  const [openDevicePop, setOpenDevicePop] = useState(false)
  const handleDevicePopover = () => {
    setOpenDevicePop(!openDevicePop)
  }
  return (
    <Popover open={openDevicePop} onOpenChange={setOpenDevicePop}>
      <PopoverTrigger asChild>
        <Button className='items-center gap-2'>
          <RectangleGoggles
            className={cn(
              'size-6 rounded-sm border p-1',
              connected
                ? 'border-green-800/60 bg-green-600/60'
                : 'border-red-800/60 bg-red-600/60',
            )}
          />
          <span className='max-lg:hidden'>Device</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='center'
        side='bottom'
        className='overflow-hidden p-0'
      >
        <div className='flex w-full p-2 pb-0'>
          <Button
            size='icon'
            variant='ghost'
            onClick={handleDevicePopover}
            className='ml-auto size-6'
          >
            <X />
          </Button>
        </div>
        <VRControlPanel devices={devices} />
        <PopoverArrow className='fill-zinc-200 dark:fill-zinc-900' />
      </PopoverContent>
    </Popover>
  )
}
