'use client'
import ExerciseList from './exercise-list'
import ControlPanel from './control-panel'
import ChartCard from './chart-card'
import SessionDialog from './session-dialog'
import QuickStartDialog from './quickstart-dialog'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'
import SessionNotesCard from './session-notes-card'
import useIsAuthed from '@/hooks/use-is-authed'
import { Button } from '@/components/ui/button'
import { useCastingHandshake } from '@/hooks/use-casting-handshake'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import useSocketConnection from '@/hooks/use-socket-connection'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { trackAnalyticsEvent } from '@/lib/analytics-contract'
import useNow from '@/hooks/use-now'

const PatientDashboard = () => {
  useIsAuthed()
  const [showCasting, setShowCasting] = useState(false)

  return (
    <div className='min-h-screen-with-nav flex justify-center'>
      <div
        className={cn(
          'container grid grid-cols-12 gap-x-4 p-8 lg:max-[1526px]:grid-rows-[repeat(65,24px)]',
          showCasting
            ? 'grid-rows-[repeat(50,24px)]'
            : 'grid-rows-[repeat(55,24px)]',
        )}
      >
        {/* INFO PANEL */}
        <div className='bg-card col-start-4 -col-end-1 row-start-1 row-end-4 rounded-xl border p-4 shadow max-[1526px]:col-start-1'>
          <ControlPanel
            showCasting={showCasting}
            setShowCasting={setShowCasting}
          />
        </div>

        <ExerciseList
          className={cn(
            'col-span-3 col-start-1 row-span-20 row-start-1 max-[1526px]:col-span-full max-[1526px]:col-start-1',
            showCasting
              ? 'max-[1526px]:row-start-28 max-[1526px]:row-end-41 lg:max-[1526px]:row-start-34 lg:max-[1526px]:row-end-48'
              : 'max-[1526px]:row-start-25 max-[1526px]:row-end-38 lg:max-[1526px]:row-start-31 lg:max-[1526px]:row-end-45',
          )}
        />

        {showCasting ? (
          <CastingContent
            className={cn(
              'relative col-span-full col-start-4 row-span-29 row-start-5 max-[1526px]:col-start-1',
              showCasting
                ? 'max-[1526px]:row-end-27 lg:max-[1526px]:row-end-33'
                : 'max-[1526px]:row-end-24 lg:max-[1526px]:row-end-30',
            )}
          />
        ) : (
          <ChartCard
            className={cn(
              'relative col-span-full col-start-4 row-span-29 row-start-5 max-[1526px]:col-start-1 lg:max-[1526px]:row-end-30',
              showCasting
                ? 'max-[1526px]:row-end-27 lg:max-[1526px]:row-end-33'
                : 'max-[1526px]:row-end-24 lg:max-[1526px]:row-end-30',
            )}
          />
        )}

        <SessionNotesCard
          className={cn(
            'col-span-full col-start-4 row-span-16 row-start-35 max-[1526px]:col-start-1',
            showCasting
              ? 'max-[1526px]:row-start-42 max-[1526px]:row-end-58 lg:max-[1526px]:row-start-49 lg:max-[1526px]:row-end-65'
              : 'max-[1526px]:row-start-39 max-[1526px]:row-end-55 lg:max-[1526px]:row-start-46 lg:max-[1526px]:row-end-65',
          )}
        />

        <SessionDialog />
        <ExerciseLibraryProvider>
          <QuickStartDialog />
        </ExerciseLibraryProvider>
      </div>
    </div>
  )
}

export default PatientDashboard

function CastingContent({ className }: { className?: string }) {
  const { state } = usePatientDashboard()
  const { ts, now, setNow } = useNow()
  const { selectedDevice } = state
  const connected = useSocketConnection({ device: selectedDevice })

  const { startCasting, stopCasting, videoRef, status } = useCastingHandshake(
    selectedDevice?.socket ?? null,
  )

  const handleStartCasting = () => {
    if (!selectedDevice) return
    setNow(now())
    startCasting()
    trackAnalyticsEvent('casting_started', {
      enabled: true,
      device_id: selectedDevice.data.id,
    })
  }

  const handleStopCasting = () => {
    if (!selectedDevice) return
    const endedAt = now()
    stopCasting()
    trackAnalyticsEvent('casting_stopped', {
      enabled: false,
      duration_sec: (endedAt - ts.current) / 1000,
      device_id: selectedDevice.data.id,
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Casting</CardTitle>
      </CardHeader>
      <CardContent className='flex h-full flex-col gap-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <Button
            onClick={handleStartCasting}
            disabled={!connected || status !== 'idle'}
          >
            Start casting
          </Button>
          <Button
            variant='outline'
            onClick={handleStopCasting}
            disabled={status === 'idle'}
          >
            Stop casting
          </Button>
          <span className='text-muted-foreground text-sm'>
            Status: {status}
          </span>
        </div>

        <div className='flex flex-1 justify-center'>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls
            className='aspect-video w-full max-w-4xl rounded-lg border bg-black object-contain'
          />
        </div>
      </CardContent>
    </Card>
  )
}
