import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { Separator } from '@virtality/ui/components/separator'
import { Button } from '@virtality/ui/components/button'
import { cn } from '@/lib/utils'
import { authClient } from '@/auth-client'
import { profileBillingHref } from '@/lib/renew-prompt-dismiss'
import ProgramSelector from './program-selector'
import { Item } from '@/components/ui/item'
import SessionExerciseChangeStatus from './session-exercise-change-status'
import Controls from './control-panel-controls'
import ModeSelector from './control-panel-mode-selector'
import SceneSettings from './control-panel-scene-settings'
import DeviceSelector from './control-panel-device-selector'
import CastingButton from './control-panel-casting-button'
import useControlPanel from './use-control-panel'

interface ControlPanelProps {
  className?: string
  showCasting: boolean
  setShowCasting: React.Dispatch<React.SetStateAction<boolean>>
}

const ControlPanel = ({
  className,
  showCasting,
  setShowCasting,
}: ControlPanelProps) => {
  const {
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
    canLaunchVr,
    checkoutCtaLabel,
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
  } = useControlPanel()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  const showSubscribeCta = !canLaunchVr && checkoutCtaLabel != null && userId

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
          isProgramLaunching={isProgramLaunching}
          treatmentLaunchReady={treatmentLaunchReady}
          programStart={programStart}
          programEnd={programEnd}
          handleWarmupStart={handleWarmupStart}
          skipExercise={skipExercise}
          isForwardSkipDisabled={forwardSkipControl.isDisabled}
          isBackSkipDisabled={backSkipControl.isDisabled}
          forwardSkipTooltip={forwardSkipControl.tooltip}
          backSkipTooltip={backSkipControl.tooltip}
          isSkipBlockedByProgramState={isSkipBlockedByProgramState}
        />
        <Separator orientation='vertical' className='h-8!' />
      </div>

      {showSubscribeCta && (
        <Button asChild variant='primary' size='lg'>
          <Link href={profileBillingHref(userId)}>
            <CreditCard />
            {checkoutCtaLabel}
          </Link>
        </Button>
      )}

      <div className='flex flex-1 gap-2'>
        {(isProgramActive || isProgramPaused) && isMain && (
          <>
            <Item variant='outline' size='sm' className='max-h-9 p-1'>
              {`Sets: ${activeExerciseData.currentSet} / ${activeExerciseData.totalSets}`}
            </Item>
            <Item variant='outline' size='sm' className='max-h-9 p-1'>
              {`Reps: ${activeExerciseData.currentRep} / ${activeExerciseData.totalReps}`}
            </Item>
            {pendingExerciseChange && (
              <SessionExerciseChangeStatus
                pendingExerciseChange={pendingExerciseChange}
                exercises={exercises}
                defaultExercises={defaultExercises}
              />
            )}
          </>
        )}

        <DeviceSelector devices={devices} connected={connected} />

        <CastingButton
          showCasting={showCasting}
          setShowCasting={setShowCasting}
        />

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
