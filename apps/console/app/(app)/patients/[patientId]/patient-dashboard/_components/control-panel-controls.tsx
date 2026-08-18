import { useEffect, useRef } from 'react'
import {
  PauseCircle,
  PlayCircle,
  SkipBack,
  SkipForward,
  StopCircle,
} from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Id } from 'react-toastify'
import { PatientDashboardValue } from '@/context/patient-dashboard-context'
import { type SkipDirection } from '@/lib/session-exercise-skip'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

let wakeLock: WakeLockSentinel | null = null

interface ControlsProps {
  selectedMode: PatientDashboardValue['state']['selectedMode']
  isProgramPaused: boolean
  isProgramInactive: boolean
  isProgramActive: boolean
  isProgramLaunching: boolean
  treatmentLaunchReady: boolean
  programStart: () => Id | undefined
  programEnd: () => void
  handleWarmupStart: () => Id | undefined
  skipExercise: (direction: SkipDirection) => void
  isForwardSkipDisabled: boolean
  isBackSkipDisabled: boolean
  forwardSkipTooltip?: string
  backSkipTooltip?: string
  isSkipBlockedByProgramState: boolean
}

const SKIP_CONTROL_ARIA_LABEL: Record<SkipDirection, string> = {
  forward: 'Skip to next exercise',
  back: 'Skip to previous exercise',
}

interface SkipControlButtonProps {
  direction: SkipDirection
  disabled: boolean
  tooltip?: string
  onClick: () => void
}

const SkipControlButton = ({
  direction,
  disabled,
  tooltip,
  onClick,
}: SkipControlButtonProps) => {
  const button = (
    <Button
      disabled={disabled}
      size='icon'
      variant='outline'
      onClick={onClick}
      aria-label={SKIP_CONTROL_ARIA_LABEL[direction]}
    >
      {direction === 'forward' ? <SkipForward /> : <SkipBack />}
    </Button>
  )

  if (!tooltip) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex'>{button}</span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

const Controls = ({
  selectedMode,
  isProgramPaused,
  isProgramInactive,
  isProgramActive,
  isProgramLaunching,
  treatmentLaunchReady,
  programStart,
  programEnd,
  handleWarmupStart,
  skipExercise,
  isForwardSkipDisabled,
  isBackSkipDisabled,
  forwardSkipTooltip,
  backSkipTooltip,
  isSkipBlockedByProgramState,
}: ControlsProps) => {
  const StartProgramButton = useRef<HTMLButtonElement>(null)
  const needsHeadsetForLaunch = isProgramInactive || isProgramPaused
  const isStartDisabled =
    isProgramLaunching || (needsHeadsetForLaunch && !treatmentLaunchReady)
  const isWarmupStartDisabled = isProgramInactive && !treatmentLaunchReady

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
        <TooltipProvider delayDuration={200}>
          <SkipControlButton
            direction='back'
            disabled={isSkipBlockedByProgramState || isBackSkipDisabled}
            tooltip={backSkipTooltip}
            onClick={() => skipExercise('back')}
          />

          <Button
            ref={StartProgramButton}
            variant='primary'
            size='icon'
            onClick={programStart}
            disabled={isStartDisabled}
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

          <SkipControlButton
            direction='forward'
            disabled={isSkipBlockedByProgramState || isForwardSkipDisabled}
            tooltip={forwardSkipTooltip}
            onClick={() => skipExercise('forward')}
          />
        </TooltipProvider>
      )

    case 'free':
      return (
        <>
          <Button
            ref={StartProgramButton}
            variant={isProgramInactive ? 'primary' : 'destructive'}
            size='icon'
            onClick={handleWarmupStart}
            disabled={isWarmupStartDisabled}
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

export default Controls
