'use client'

import { Badge } from '@virtality/ui/components/badge'
import {
  Card,
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
  immersiveHintLine,
  immersiveStatusBadge,
} from '@/lib/immersive-video-status'
import { cn } from '@/lib/utils'

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
  const hintLine = immersiveHintLine({ status: playback.state.status })

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle>{selectedRow?.title ?? 'No video selected'}</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
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
        {hintLine ? <p className='text-sm'>{hintLine}</p> : null}
        {gateCopy ? (
          <p className='text-muted-foreground text-sm'>{gateCopy}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
