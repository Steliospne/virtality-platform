import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLaunchIntentFromUrl } from './use-launch-intent-from-url'
import {
  AUTO_LAUNCH_GAVE_UP,
  AUTO_LAUNCH_TIMEOUT_MS,
  type AutoLaunchGate,
} from '@/lib/patient-dashboard-auto-launch'
import type { VRDevice } from '@/types/models'

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  search: new URLSearchParams(),
  toastError: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => '/patients/p1/patient-dashboard',
  useSearchParams: () => mocks.search,
}))
vi.mock('react-toastify', () => ({ toast: { error: mocks.toastError } }))

const readyGate: AutoLaunchGate = {
  selectedMode: 'main',
  inQuickStart: false,
  exerciseCount: 3,
  treatmentLaunchReady: true,
  missingSettings: false,
  programState: 'ready',
}

function makeDevice(): VRDevice {
  return {
    data: { id: 'device', deviceId: 'headset' },
    mutations: { setDeviceRoomCode: vi.fn(), clearDeviceRoomCode: vi.fn() },
  } as unknown as VRDevice
}

function setup(gate: AutoLaunchGate, connected = false) {
  const deps = {
    selectedDevice: makeDevice(),
    connect: vi.fn().mockResolvedValue(undefined),
    programStart: vi.fn(),
    setInQuickStart: vi.fn(),
    setSelectedMode: vi.fn(),
  }
  const hook = renderHook(
    (props: { gate: AutoLaunchGate; consoleConnected: boolean }) =>
      useLaunchIntentFromUrl({
        ...deps,
        gate: props.gate,
        consoleConnected: props.consoleConnected,
        launchError: props.gate.treatmentLaunchReady
          ? null
          : 'Waiting for the VR headset to connect.',
      }),
    { initialProps: { gate, consoleConnected: connected } },
  )
  return { ...deps, ...hook }
}

describe('useLaunchIntentFromUrl', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.search = new URLSearchParams('launch=1')
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('does nothing without a launch intent', () => {
    mocks.search = new URLSearchParams()
    const { connect, programStart, result } = setup(readyGate)

    expect(result.current.autoLaunchArmed).toBe(false)
    expect(connect).not.toHaveBeenCalled()
    expect(programStart).not.toHaveBeenCalled()
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it('arms once, strips the params, forces Exercise Mode and connects with the room code', () => {
    const waiting = { ...readyGate, treatmentLaunchReady: false }
    const { connect, selectedDevice, setSelectedMode, result } = setup(waiting)

    expect(result.current.autoLaunchArmed).toBe(true)
    expect(mocks.replace).toHaveBeenCalledWith('/patients/p1/patient-dashboard')
    expect(setSelectedMode).toHaveBeenCalledWith('main')
    expect(selectedDevice.mutations.setDeviceRoomCode).toHaveBeenCalledWith(
      'headset',
    )
    expect(connect).toHaveBeenCalledTimes(1)
  })

  it('opens Quick Start when asked and launches once the dialog closes with exercises', () => {
    mocks.search = new URLSearchParams('launch=1&quickstart=1')
    const inDialog = { ...readyGate, inQuickStart: true, exerciseCount: 0 }
    const { programStart, setInQuickStart, rerender, result } = setup(
      inDialog,
      true,
    )

    expect(setInQuickStart).toHaveBeenCalledWith(true)
    expect(programStart).not.toHaveBeenCalled()

    // The clock must not run out while the clinician is in the dialog.
    act(() => vi.advanceTimersByTime(AUTO_LAUNCH_TIMEOUT_MS * 2))
    expect(result.current.autoLaunchArmed).toBe(true)

    rerender({ gate: readyGate, consoleConnected: true })
    expect(programStart).toHaveBeenCalledTimes(1)
    expect(result.current.autoLaunchArmed).toBe(false)
  })

  it('launches as soon as the headset becomes ready, exactly once', () => {
    const waiting = { ...readyGate, treatmentLaunchReady: false }
    const { programStart, rerender, result } = setup(waiting)

    rerender({ gate: readyGate, consoleConnected: true })
    rerender({ gate: readyGate, consoleConnected: true })

    expect(programStart).toHaveBeenCalledTimes(1)
    expect(result.current.autoLaunchArmed).toBe(false)
  })

  it('stands down when the clinician starts something themselves', () => {
    const waiting = { ...readyGate, treatmentLaunchReady: false }
    const { programStart, rerender, result } = setup(waiting)

    rerender({
      gate: { ...waiting, programState: 'launching' },
      consoleConnected: true,
    })

    expect(programStart).not.toHaveBeenCalled()
    expect(result.current.autoLaunchArmed).toBe(false)
  })

  it('gives up with the reason after the bounded wait', () => {
    const waiting = { ...readyGate, treatmentLaunchReady: false }
    const { programStart, result } = setup(waiting, true)

    act(() => vi.advanceTimersByTime(AUTO_LAUNCH_TIMEOUT_MS))

    expect(programStart).not.toHaveBeenCalled()
    expect(result.current.autoLaunchArmed).toBe(false)
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Waiting for the VR headset to connect.',
    )
  })

  it('names the missing program when that is what blocked it', () => {
    const { result } = setup({ ...readyGate, exerciseCount: 0 }, true)

    act(() => vi.advanceTimersByTime(AUTO_LAUNCH_TIMEOUT_MS))

    expect(result.current.autoLaunchArmed).toBe(false)
    expect(mocks.toastError).toHaveBeenCalledWith(
      AUTO_LAUNCH_GAVE_UP.noExercises,
    )
  })
})
