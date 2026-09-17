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
import { trackAnalyticsEvent } from '@/lib/analytics-contract'
import useNow from '@/hooks/use-now'
import { CastingPanel } from '@/components/ui/casting-panel'
import { useLiveEntitlementStanding } from '@/hooks/use-live-entitlement-standing'
import { ImmersiveVideoPanel } from './immersive-video-panel'
import { PatientDashboardVideoDialogs } from './patient-dashboard-video-dialogs'
import {
  dashboardCastingClassName,
  dashboardChartClassName,
  dashboardExerciseListClassName,
  dashboardGridClassName,
  dashboardInfoPanelClassName,
  dashboardSessionNotesClassName,
} from './patient-dashboard-grid'

const PatientDashboard = () => {
  useIsAuthed()
  const [showCasting, setShowCasting] = useState(false)
  const { canLaunchVr } = useLiveEntitlementStanding()
  const showExpiredBanner = !canLaunchVr
  const { state } = usePatientDashboard()
  const isImmersive = state.selectedMode === 'immersive'
  const gridFlags = {
    showExpiredBanner,
    showCasting,
    hideExerciseList: isImmersive,
  }
  const exerciseListClassName = dashboardExerciseListClassName(gridFlags)
  const chartClassName = dashboardChartClassName(showExpiredBanner, isImmersive)
  const castingClassName = dashboardCastingClassName(
    showExpiredBanner,
    isImmersive,
  )

  return (
    <div className='min-h-screen-with-nav flex justify-center'>
      <div className={dashboardGridClassName(gridFlags)}>
        {/* INFO PANEL */}
        <div
          className={dashboardInfoPanelClassName(
            showExpiredBanner,
            isImmersive,
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

        {isImmersive ? null : (
          <ExerciseList className={exerciseListClassName} />
        )}

        {isImmersive && !showCasting ? (
          <ImmersiveVideoPanel className={chartClassName} />
        ) : null}

        {showCasting ? (
          <CastingContent className={castingClassName} />
        ) : isImmersive ? null : (
          <ChartCard className={chartClassName} />
        )}

        {isImmersive ? null : (
          <SessionNotesCard
            className={dashboardSessionNotesClassName(gridFlags)}
          />
        )}

        <SessionDialog />
        <PatientDashboardVideoDialogs />
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
