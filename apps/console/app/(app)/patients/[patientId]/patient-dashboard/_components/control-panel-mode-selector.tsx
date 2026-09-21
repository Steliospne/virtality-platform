'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PatientDashboardValue } from '@/context/patient-dashboard-context'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  canEnterImmersiveMode,
  isDashboardMode,
  isLeavingImmersiveLocked,
  isProgramModeSwitchLocked,
  LEAVE_IMMERSIVE_MODE_HINT,
} from '@/lib/control-panel-mode'
import type { ImmersivePlaybackStatus } from '@/lib/immersive-video-playback-reducer'

interface ModeSelectorProps {
  selectedMode: PatientDashboardValue['state']['selectedMode']
  setSelectedMode: PatientDashboardValue['handler']['setSelectedMode']
  programState: PatientDashboardValue['state']['programState']
  playbackStatus: ImmersivePlaybackStatus
  frozen?: boolean
}

const ModeSelector = ({
  selectedMode,
  setSelectedMode,
  programState,
  playbackStatus,
  frozen = false,
}: ModeSelectorProps) => {
  const programLocked = isProgramModeSwitchLocked(programState)
  const leavingLocked =
    selectedMode === 'immersive' && isLeavingImmersiveLocked(playbackStatus)
  const triggerDisabled = programLocked || leavingLocked || frozen

  const handleModeChange = (value: string) => {
    if (!isDashboardMode(value)) return
    if (value === 'immersive' && !canEnterImmersiveMode(programState)) return
    if (leavingLocked && value !== 'immersive') return
    setSelectedMode(value)
  }

  const trigger = (
    <SelectTrigger
      disabled={triggerDisabled}
      className='border dark:border-zinc-600 dark:bg-zinc-900'
    >
      <SelectValue placeholder='Choose Mode...' />
    </SelectTrigger>
  )

  return (
    <TooltipProvider delayDuration={200}>
      <Select
        defaultValue='main'
        value={selectedMode}
        onValueChange={handleModeChange}
      >
        {leavingLocked ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='inline-flex'>
                {trigger}
                <span className='sr-only'>{LEAVE_IMMERSIVE_MODE_HINT}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{LEAVE_IMMERSIVE_MODE_HINT}</TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
        <SelectContent className='dark:bg-zinc-900'>
          <SelectItem key='free' value='free'>
            Free Mode
          </SelectItem>
          <SelectItem key='main' value='main'>
            Exercise Mode
          </SelectItem>
          <SelectItem
            key='immersive'
            value='immersive'
            disabled={!canEnterImmersiveMode(programState)}
          >
            Immersive Video
          </SelectItem>
        </SelectContent>
      </Select>
    </TooltipProvider>
  )
}

export default ModeSelector
