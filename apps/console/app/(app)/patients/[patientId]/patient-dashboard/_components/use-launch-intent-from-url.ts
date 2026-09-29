'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'
import type { DashboardMode, VRDevice } from '@/types/models'
import {
  AUTO_LAUNCH_TIMEOUT_MS,
  autoLaunchClockRunning,
  parseLaunchIntent,
  resolveAutoLaunchGaveUpMessage,
  resolveAutoLaunchStep,
  type AutoLaunchGate,
} from '@/lib/patient-dashboard-auto-launch'

type LaunchIntentDeps = {
  gate: AutoLaunchGate
  selectedDevice: VRDevice | null
  consoleConnected: boolean
  /** Manual-Start error for the current gate, used when giving up. */
  launchError: string | null
  connect: () => Promise<void>
  programStart: () => unknown
  setInQuickStart: (open: boolean) => void
  setSelectedMode: (mode: DashboardMode) => void
}

/**
 * Honours `?launch=1` / `?quickstart=1` set by the home dashboard's Session
 * Picker: opens Quick Start, connects the remembered headset, and presses
 * Start on the clinician's behalf the first moment the manual-Start gate
 * opens. The params are dropped on arrival so a refresh never re-fires, and
 * an armed launch gives up (with the reason) after a bounded wait.
 */
export function useLaunchIntentFromUrl({
  gate,
  selectedDevice,
  consoleConnected,
  launchError,
  connect,
  programStart,
  setInQuickStart,
  setSelectedMode,
}: LaunchIntentDeps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const intent = parseLaunchIntent(searchParams)

  const [armed, setArmed] = useState(false)
  const gateRef = useRef(gate)
  gateRef.current = gate
  const launchErrorRef = useRef(launchError)
  launchErrorRef.current = launchError

  // Arm once, then strip the params.
  useEffect(() => {
    if (!intent.launch && !intent.quickStart) return
    if (intent.quickStart) setInQuickStart(true)
    if (intent.launch) {
      // The picker chose exercises, so treatment runs in Exercise Mode.
      setSelectedMode('main')
      setArmed(true)
    }
    router.replace(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent.launch, intent.quickStart, pathname])

  // Bring the remembered headset online the way the Device popover does:
  // room code first, then connect. Failures surface in the connection badge
  // and the timeout below gives up.
  useEffect(() => {
    if (!armed || !selectedDevice || consoleConnected) return
    const deviceId = selectedDevice.data.deviceId
    if (!deviceId) return
    selectedDevice.mutations.setDeviceRoomCode(deviceId)
    void connect().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, selectedDevice, consoleConnected])

  // Launch, keep waiting, or stand down.
  useEffect(() => {
    if (!armed) return
    const step = resolveAutoLaunchStep(gate)
    if (step === 'wait') return
    setArmed(false)
    if (step === 'launch') programStart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, gate])

  // Give up after a bounded wait; the clock pauses while Quick Start is open.
  const clockRunning = armed && autoLaunchClockRunning(gate)
  useEffect(() => {
    if (!clockRunning) return
    const timer = setTimeout(() => {
      setArmed(false)
      toast.error(
        resolveAutoLaunchGaveUpMessage(gateRef.current, launchErrorRef.current),
      )
    }, AUTO_LAUNCH_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [clockRunning])

  return { autoLaunchArmed: armed }
}
