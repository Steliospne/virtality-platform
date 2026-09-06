'use client'
import ExerciseList from './exercise-list'
import ControlPanel from './control-panel'
import { VrAccessExpiredBanner } from './vr-access-expired-banner'
import ChartCard from './chart-card'
import SessionDialog from './session-dialog'
import QuickStartDialog from './quickstart-dialog'
import { ExerciseLibraryProvider } from '@/context/exercise-library-context'
import SessionNotesCard from './session-notes-card'
import useIsAuthed from '@/hooks/use-is-authed'
import { useCastingHandshake } from '@/hooks/use-casting-handshake'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import useSocketConnection from '@/hooks/use-socket-connection'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { trackAnalyticsEvent } from '@/lib/analytics-contract'
import useNow from '@/hooks/use-now'
import { CastingPanel } from '@/components/ui/casting-panel'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'

/** Extra grid rows reserved above the control panel for the VR access banner. */
const BANNER_ROWS = 3

const PatientDashboard = () => {
  useIsAuthed()
  const [showCasting, setShowCasting] = useState(false)
  const { canLaunchVr } = useLiveEntitlementStanding()
  const showExpiredBanner = !canLaunchVr

  return (
    <div className='min-h-screen-with-nav flex justify-center'>
      <div
        className={cn(
          'container grid grid-cols-12 gap-x-4 p-8',
          showExpiredBanner
            ? 'lg:max-[1526px]:grid-rows-[repeat(68,24px)]'
            : 'lg:max-[1526px]:grid-rows-[repeat(65,24px)]',
          showExpiredBanner
            ? showCasting
              ? 'grid-rows-[repeat(53,24px)]'
              : 'grid-rows-[repeat(58,24px)]'
            : showCasting
              ? 'grid-rows-[repeat(50,24px)]'
              : 'grid-rows-[repeat(55,24px)]',
        )}
      >
        {/* INFO PANEL */}
        <div
          className={cn(
            'col-start-4 -col-end-1 row-start-1 flex flex-col gap-3 max-[1526px]:col-start-1',
            showExpiredBanner ? 'row-end-7' : 'row-end-4',
          )}
        >
          <VrAccessExpiredBanner />
          <div className='bg-card rounded-xl border p-4 shadow'>
            <ControlPanel
              showCasting={showCasting}
              setShowCasting={setShowCasting}
            />
          </div>
        </div>

        <ExerciseList
          className={cn(
            'col-span-3 col-start-1 row-span-20 row-start-1 max-[1526px]:col-span-full max-[1526px]:col-start-1',
            showExpiredBanner
              ? showCasting
                ? 'max-[1526px]:row-start-31 max-[1526px]:row-end-44 lg:max-[1526px]:row-start-37 lg:max-[1526px]:row-end-51'
                : 'max-[1526px]:row-start-28 max-[1526px]:row-end-41 lg:max-[1526px]:row-start-34 lg:max-[1526px]:row-end-48'
              : showCasting
                ? 'max-[1526px]:row-start-28 max-[1526px]:row-end-41 lg:max-[1526px]:row-start-34 lg:max-[1526px]:row-end-48'
                : 'max-[1526px]:row-start-25 max-[1526px]:row-end-38 lg:max-[1526px]:row-start-31 lg:max-[1526px]:row-end-45',
          )}
        />

        {showCasting ? (
          <CastingContent
            className={cn(
              'relative col-span-full col-start-4 row-span-29 max-[1526px]:col-start-1',
              showExpiredBanner ? 'row-start-8' : 'row-start-5',
              showExpiredBanner
                ? 'max-[1526px]:row-end-30 lg:max-[1526px]:row-end-36'
                : 'max-[1526px]:row-end-27 lg:max-[1526px]:row-end-33',
            )}
          />
        ) : (
          <ChartCard
            className={cn(
              'relative col-span-full col-start-4 row-span-29 max-[1526px]:col-start-1',
              showExpiredBanner ? 'row-start-8' : 'row-start-5',
              showExpiredBanner
                ? 'max-[1526px]:row-end-27 lg:max-[1526px]:row-end-33'
                : 'max-[1526px]:row-end-24 lg:max-[1526px]:row-end-30',
            )}
          />
        )}

        <SessionNotesCard
          className={cn(
            'col-span-full col-start-4 row-span-16 max-[1526px]:col-start-1',
            showExpiredBanner ? 'row-start-38' : 'row-start-35',
            showExpiredBanner
              ? showCasting
                ? 'max-[1526px]:row-start-45 max-[1526px]:row-end-61 lg:max-[1526px]:row-start-52 lg:max-[1526px]:row-end-68'
                : 'max-[1526px]:row-start-42 max-[1526px]:row-end-58 lg:max-[1526px]:row-start-49 lg:max-[1526px]:row-end-68'
              : showCasting
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
  const { connected } = useSocketConnection({ device: selectedDevice })

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
    <CastingPanel
      className={className}
      connected={connected}
      status={status}
      videoRef={videoRef}
      onStartCasting={handleStartCasting}
      onStopCasting={handleStopCasting}
    />
  )
}
