'use client'

import { CircleAlert, Loader2, MonitorPlay } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RefObject } from 'react'
import { Button } from '@virtality/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CastingStatus } from '@/hooks/use-casting-handshake'
import { useCastingLoadTimeout } from '@/hooks/use-casting-load-timeout'
import {
  getCastingControlAction,
  getCastingControlLabelForAction,
  getCastingPlayerView,
  getCastingStatusLabel,
  isCastingControlDisabled,
  shouldShowVideoControls,
  shouldShowVideoElement,
  type CastingPlayerView,
} from '@/lib/patient-dashboard-casting-panel'
import { cn } from '@/lib/utils'

type CastingPanelProps = {
  className?: string
  connected: boolean
  status: CastingStatus
  videoRef: RefObject<HTMLVideoElement | null>
  onStartCasting: () => void
  onStopCasting: () => void
}

export function CastingPanel({
  className,
  connected,
  status,
  videoRef,
  onStartCasting,
  onStopCasting,
}: CastingPanelProps) {
  const playerView = getCastingPlayerView(status)
  const controlAction = getCastingControlAction(status)
  const controlDisabled = isCastingControlDisabled(status, connected)
  const mountVideo = shouldShowVideoElement(playerView)
  const showVideoControls = shouldShowVideoControls(playerView)
  const isStreamVisible = playerView === 'connected'
  const { showTimeoutPrompt, handleWait } = useCastingLoadTimeout(playerView)

  const handleControlClick = () => {
    if (controlAction === 'start') {
      onStartCasting()
      return
    }

    onStopCasting()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Casting</CardTitle>
      </CardHeader>
      <CardContent className='flex h-full flex-col gap-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <Button
            variant={controlAction === 'stop' ? 'outline' : 'default'}
            onClick={handleControlClick}
            disabled={controlDisabled}
          >
            {getCastingControlLabelForAction(controlAction)}
          </Button>
          <span
            aria-live='polite'
            className='text-muted-foreground text-sm select-none'
          >
            {getCastingStatusLabel(status)}
          </span>
        </div>

        <div className='flex flex-1 justify-center'>
          <div className='relative aspect-video w-full max-w-4xl'>
            <CastingPlayerOverlay view={playerView} />
            {mountVideo && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls={showVideoControls}
                className={cn(
                  'size-full rounded-lg border bg-black object-contain',
                  isStreamVisible
                    ? 'relative z-10'
                    : 'pointer-events-none absolute inset-0 opacity-0',
                )}
              />
            )}
          </div>
        </div>
      </CardContent>

      <CastingTimeoutPrompt
        open={showTimeoutPrompt}
        onWait={handleWait}
        onCancel={onStopCasting}
      />
    </Card>
  )
}

type CastingTimeoutPromptProps = {
  open: boolean
  onWait: () => void
  onCancel: () => void
}

function CastingTimeoutPrompt({
  open,
  onWait,
  onCancel,
}: CastingTimeoutPromptProps) {
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Casting is taking longer than expected</DialogTitle>
          <DialogDescription>
            The VR headset stream has not appeared yet. You can keep waiting or
            cancel casting.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={onWait}>
            Wait
          </Button>
          <Button variant='destructive' onClick={onCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CastingPlayerOverlay({ view }: { view: CastingPlayerView }) {
  switch (view) {
    case 'idle':
      return (
        <CastingPlaceholder
          icon={<MonitorPlay className='size-10 opacity-60' />}
          title='Casting idle preview'
          description='Start casting to view the VR headset stream.'
        />
      )
    case 'loading':
      return <CastingLoadingState />
    case 'error':
      return (
        <CastingPlaceholder
          icon={<CircleAlert className='size-10' />}
          title='Unable to start casting'
          description='Check the device connection and try again.'
          variant='error'
        />
      )
    case 'connected':
      return null
  }
}

type CastingPlaceholderProps = {
  icon: ReactNode
  title: string
  description: string
  variant?: 'muted' | 'error'
}

function CastingPlaceholder({
  icon,
  title,
  description,
  variant = 'muted',
}: CastingPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex size-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed',
        variant === 'muted' && 'bg-muted/40 text-muted-foreground',
        variant === 'error' && 'bg-destructive/5 text-destructive',
      )}
    >
      {icon}
      <p className='text-sm font-medium'>{title}</p>
      <p
        className={cn(
          'text-xs',
          variant === 'error' && 'text-muted-foreground',
        )}
      >
        {description}
      </p>
    </div>
  )
}

function CastingLoadingState() {
  return (
    <div className='bg-muted/40 text-muted-foreground absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg border'>
      <Loader2 className='size-8 animate-spin' />
      <p className='text-sm font-medium'>Connecting to headset stream...</p>
    </div>
  )
}
