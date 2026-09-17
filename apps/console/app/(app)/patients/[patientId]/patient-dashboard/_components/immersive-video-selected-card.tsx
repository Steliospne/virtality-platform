'use client'

import { Badge } from '@virtality/ui/components/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import { useImmersiveVideoSession } from '@/context/immersive-video-session-context'
import {
  immersiveHeadsetGateCopy,
  immersiveSelectedMetaLine,
} from '@/lib/immersive-video-picker'
import {
  immersiveStatusBadge,
  shouldShowImmersivePlaybackBar,
} from '@/lib/immersive-video-status'
import { cn } from '@/lib/utils'
import { ImmersiveVideoPlaybackBar } from './immersive-video-playback-bar'
import { ImmersiveVideoSessionTimer } from './immersive-video-session-timer'

export function ImmersiveVideoSelectedCard({
  className,
}: {
  className?: string
}) {
  const { state } = usePatientDashboard()
  const { selectedRow, playback, roomComplete, replaced, pollOnline } =
    useImmersiveVideoSession()
  const gateCopy = immersiveHeadsetGateCopy({
    roomComplete,
    replaced,
    pollOnline,
  })
  const showPlaybackBar = shouldShowImmersivePlaybackBar(playback.state.status)

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle>{selectedRow?.title ?? 'No video selected'}</CardTitle>
        <CardAction>
          <ImmersiveVideoSessionTimer />
        </CardAction>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        <div className='flex flex-wrap items-center gap-2'>
          {selectedRow ? (
            <p className='text-muted-foreground text-sm'>
              {immersiveSelectedMetaLine({ activity: selectedRow.activity })}
            </p>
          ) : null}
          <Badge variant='outline'>
            {immersiveStatusBadge({
              status: playback.state.status,
              headsetName: state.selectedDevice?.data.name ?? null,
            })}
          </Badge>
        </div>
        {gateCopy ? (
          <p className='text-muted-foreground text-sm'>{gateCopy}</p>
        ) : null}
        {showPlaybackBar ? <ImmersiveVideoPlaybackBar /> : null}
      </CardContent>
    </Card>
  )
}
