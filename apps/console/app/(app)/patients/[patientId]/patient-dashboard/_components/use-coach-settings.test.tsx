import { act, cleanup, renderHook } from '@testing-library/react'
import { Activity, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useCoachSettings from './use-coach-settings'

type Options = Parameters<typeof useCoachSettings>[0]

function options(overrides: Partial<Options> = {}): Options {
  return {
    patientId: 'patient-a',
    programState: 'ready',
    selectedMode: 'main',
    selectedDevice: null,
    headsetReady: false,
    ...overrides,
  }
}

afterEach(cleanup)

describe('coach settings visit state', () => {
  it('defaults on, changes locally before start, and survives ordinary rerenders', () => {
    const { result, rerender } = renderHook(useCoachSettings, {
      initialProps: options(),
    })
    expect(result.current.coachEnabled).toBe(true)
    expect(result.current.coachToggleDisabled).toBe(false)
    act(() => result.current.changeCoachEnabled(false))
    rerender(options({ headsetReady: true }))
    expect(result.current.coachEnabled).toBe(false)
    act(() => result.current.changeCoachEnabled(true))
    expect(result.current.coachEnabled).toBe(true)
  })

  it('resets when changing patients and when returning to the first patient', () => {
    const { result, rerender } = renderHook(useCoachSettings, {
      initialProps: options(),
    })
    act(() => result.current.changeCoachEnabled(false))
    rerender(options({ patientId: 'patient-b' }))
    expect(result.current.coachEnabled).toBe(true)
    act(() => result.current.changeCoachEnabled(false))
    rerender(options())
    expect(result.current.coachEnabled).toBe(true)
  })

  it('starts enabled after unmount and a fresh visit', () => {
    const first = renderHook(() => useCoachSettings(options()))
    act(() => first.result.current.changeCoachEnabled(false))
    first.unmount()
    const second = renderHook(() => useCoachSettings(options()))
    expect(second.result.current.coachEnabled).toBe(true)
  })

  it('resets on restoration from the browser back-forward cache', () => {
    const { result } = renderHook(() => useCoachSettings(options()))
    act(() => result.current.changeCoachEnabled(false))
    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent('pageshow', { persisted: true }),
      )
    })
    expect(result.current.coachEnabled).toBe(true)
  })

  it('resets when React restores a cached dashboard', () => {
    let mode: 'visible' | 'hidden' = 'visible'
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Activity mode={mode}>{children}</Activity>
    )
    const { result, rerender } = renderHook(() => useCoachSettings(options()), {
      wrapper,
    })
    act(() => result.current.changeCoachEnabled(false))
    mode = 'hidden'
    rerender()
    mode = 'visible'
    rerender()
    expect(result.current.coachEnabled).toBe(true)
  })
})

describe('live coach changes', () => {
  function device() {
    const ToggleCoach = vi.fn()
    const selectedDevice = {
      events: { program: { ToggleCoach } },
    } as unknown as Options['selectedDevice']
    return { ToggleCoach, selectedDevice }
  }

  it.each(['started', 'paused'] as const)(
    'sends explicit off and on while %s',
    (programState) => {
      const { selectedDevice, ToggleCoach } = device()
      const { result } = renderHook(() =>
        useCoachSettings(
          options({
            programState,
            selectedDevice,
            headsetReady: true,
          }),
        ),
      )
      act(() => result.current.changeCoachEnabled(false))
      act(() => result.current.changeCoachEnabled(true))
      expect(ToggleCoach.mock.calls).toEqual([[false], [true]])
    },
  )

  it.each(['ready', 'free', 'immersive'] as const)(
    'does not emit for %s',
    (mode) => {
      const { selectedDevice, ToggleCoach } = device()
      const { result } = renderHook(() =>
        useCoachSettings(
          options({
            programState: mode === 'ready' ? 'ready' : 'started',
            selectedMode: mode === 'ready' ? 'main' : mode,
            selectedDevice,
            headsetReady: true,
          }),
        ),
      )
      act(() => result.current.changeCoachEnabled(false))
      expect(result.current.coachEnabled).toBe(false)
      expect(ToggleCoach).not.toHaveBeenCalled()
    },
  )

  it.each([
    { programState: 'launching', headsetReady: true },
    { programState: 'started', headsetReady: false },
    { programState: 'paused', headsetReady: false },
  ] as const)(
    'blocks changes for $programState with headsetReady=$headsetReady',
    (state) => {
      const { selectedDevice, ToggleCoach } = device()
      const { result } = renderHook(() =>
        useCoachSettings(options({ ...state, selectedDevice })),
      )
      expect(result.current.coachToggleDisabled).toBe(true)
      act(() => result.current.changeCoachEnabled(false))
      expect(result.current.coachEnabled).toBe(true)
      expect(ToggleCoach).not.toHaveBeenCalled()
    },
  )
})
