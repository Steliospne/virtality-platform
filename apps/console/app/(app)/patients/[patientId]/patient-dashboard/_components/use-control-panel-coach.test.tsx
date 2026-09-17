import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useControlPanel from './use-control-panel'

const mocks = vi.hoisted(() => {
  const program = {
    Start: vi.fn(),
    Pause: vi.fn(),
    WarmupStart: vi.fn(),
    ToggleCoach: vi.fn(),
  }
  const device = {
    data: { id: 'device', deviceId: 'headset' },
    events: { program },
  }
  return {
    program,
    device,
    state: {
      programState: 'ready',
      selectedMode: 'main',
      selectedAvatar: { id: '1' },
      selectedMap: { id: '2' },
      selectedDevice: device,
      exercises: [
        {
          id: 'row',
          exerciseId: 'exercise',
          sets: 2,
          reps: 5,
          restTime: 3,
          holdTime: 1,
          speed: 1,
          romMode: 0,
        },
      ],
      activeExerciseData: { id: null },
      pendingExerciseChange: null,
    },
    handler: {
      setSelectedMode: vi.fn(),
      setSelectedDevice: vi.fn(),
      setActiveExerciseData: vi.fn(),
      setProgramState: vi.fn(),
    },
    connected: true,
    headsetPresent: true,
    canLaunchVr: true,
    entitlementPending: false,
  }
})

vi.mock('@/context/patient-dashboard-context', () => ({
  usePatientDashboard: () => ({
    state: mocks.state,
    handler: mocks.handler,
    patientId: 'patient',
    currExercise: { current: 0 },
  }),
}))
vi.mock('@/context/device-context', () => ({
  useDeviceContext: () => ({ devices: [mocks.device] }),
}))
vi.mock('@/hooks/use-socket-connection', () => ({
  default: () => ({ connected: mocks.connected }),
}))
vi.mock('@/hooks/use-vr-headset-presence', () => ({
  useVrHeadsetPresence: () => mocks.headsetPresent,
}))
vi.mock('@/hooks/use-live-entitlement-standing', () => ({
  useLiveEntitlementStanding: () => ({
    canLaunchVr: mocks.canLaunchVr,
    isPending: mocks.entitlementPending,
  }),
}))
vi.mock('@/hooks/use-navigation-guard', () => ({
  default: () => ({
    guard: { open: false, onStay: vi.fn(), onLeave: vi.fn() },
  }),
}))
vi.mock('@/components/ui/ErrorToasty', () => ({ default: vi.fn() }))
vi.mock('tinybase/ui-react', () => ({
  useRow: () => ({ lastHeadset: 'device' }),
  useValue: () => undefined,
  useStore: () => undefined,
}))
vi.mock('@virtality/react-query', () => ({
  usePatient: () => ({ data: { language: 'en' } }),
  usePatientSessions: () => ({ data: [{ id: 'previous-session' }] }),
  useExercise: () => ({ data: [] }),
}))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  mocks.state.programState = 'ready'
  mocks.state.selectedMode = 'main'
  mocks.connected = true
  mocks.headsetPresent = true
  mocks.canLaunchVr = true
  mocks.entitlementPending = false
})

describe('program launch coach setting', () => {
  it.each([true, false])(
    'sends coachEnabled=%s without changing existing settings or exercises',
    (coachEnabled) => {
      const { result } = renderHook(useControlPanel)
      act(() => result.current.changeCoachEnabled(coachEnabled))
      act(() => result.current.programStart())
      expect(mocks.program.Start).toHaveBeenCalledExactlyOnceWith({
        exerciseData: [
          {
            id: 'exercise',
            sets: 2,
            reps: 5,
            restTime: 3,
            holdTime: 1,
            speed: 1,
            romMode: 0,
          },
        ],
        settings: {
          avatarId: '1',
          mapId: '2',
          sessionNumber: 1,
          language: 'en',
          coachEnabled,
        },
      })
      expect(mocks.handler.setProgramState).toHaveBeenCalledWith('launching')
      expect(mocks.program.ToggleCoach).not.toHaveBeenCalled()
    },
  )

  it('keeps the selected value for another launch within the same visit', () => {
    const { result, rerender } = renderHook(useControlPanel)
    act(() => result.current.changeCoachEnabled(false))
    act(() => result.current.programStart())
    mocks.state.programState = 'started'
    rerender()
    mocks.state.programState = 'ready'
    rerender()
    act(() => result.current.programStart())
    expect(
      mocks.program.Start.mock.calls.map(
        ([payload]) => payload.settings.coachEnabled,
      ),
    ).toEqual([false, false])
  })

  it('preserves pause/resume dispatch', () => {
    mocks.state.programState = 'paused'
    const { result } = renderHook(useControlPanel)
    act(() => result.current.programStart())
    expect(mocks.program.Pause).toHaveBeenCalledOnce()
    expect(mocks.program.Start).not.toHaveBeenCalled()
  })

  it('blocks program and warmup launch while entitlement is loading', () => {
    mocks.entitlementPending = true
    const { result } = renderHook(useControlPanel)
    act(() => result.current.changeCoachEnabled(false))
    expect(result.current.treatmentLaunchReady).toBe(false)
    act(() => result.current.programStart())
    act(() => result.current.handleWarmupStart())
    expect(mocks.program.Start).not.toHaveBeenCalled()
    expect(mocks.program.WarmupStart).not.toHaveBeenCalled()
  })

  it('preserves warmup payload', () => {
    mocks.state.selectedMode = 'free'
    const { result } = renderHook(useControlPanel)
    act(() => result.current.changeCoachEnabled(false))
    act(() => result.current.handleWarmupStart())
    expect(mocks.program.WarmupStart).toHaveBeenCalledExactlyOnceWith({
      settings: { avatarId: '1', mapId: '2', sessionNumber: 1 },
    })
    expect(mocks.program.ToggleCoach).not.toHaveBeenCalled()
  })

  it.each(['connected', 'headsetPresent', 'canLaunchVr'] as const)(
    'preserves the %s launch guard',
    (guard) => {
      mocks[guard] = false
      const { result } = renderHook(useControlPanel)
      act(() => result.current.programStart())
      expect(mocks.program.Start).not.toHaveBeenCalled()
    },
  )
})
