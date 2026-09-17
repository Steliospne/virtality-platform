import { useEffect, useState } from 'react'
import type { PatientDashboardValue } from '@/context/patient-dashboard-context'

type DashboardState = PatientDashboardValue['state']

interface CoachSettingsOptions {
  patientId: string
  programState: DashboardState['programState']
  selectedMode: DashboardState['selectedMode']
  selectedDevice: DashboardState['selectedDevice']
  headsetReady: boolean
}

export default function useCoachSettings({
  patientId,
  programState,
  selectedMode,
  selectedDevice,
  headsetReady,
}: CoachSettingsOptions) {
  const [coachEnabled, setCoachEnabled] = useState(true)

  useEffect(() => {
    // Also resets when React restores a previously hidden dashboard.
    setCoachEnabled(true)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setCoachEnabled(true)
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [patientId])

  const isLiveProgram =
    selectedMode === 'main' &&
    (programState === 'started' || programState === 'paused')
  const coachToggleDisabled =
    programState === 'launching' || (isLiveProgram && !headsetReady)

  const changeCoachEnabled = (enabled: boolean) => {
    if (coachToggleDisabled) return
    setCoachEnabled(enabled)
    if (isLiveProgram) {
      selectedDevice?.events.program.ToggleCoach(enabled)
    }
  }

  return { coachEnabled, changeCoachEnabled, coachToggleDisabled }
}
