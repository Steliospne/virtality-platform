import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useImmersiveTimeLimit } from './use-immersive-time-limit'

afterEach(cleanup)

function setup(sessionElapsedSec: number | null) {
  return renderHook(useImmersiveTimeLimit, { initialProps: sessionElapsedSec })
}

describe('useImmersiveTimeLimit', () => {
  it('counts from the play command when picked before play', () => {
    const { result, rerender } = setup(null)
    act(() => result.current.setStopAfterMin(20))
    expect(result.current.timeLimitElapsedSec).toBe(null)
    rerender(0)
    expect(result.current.timeLimitElapsedSec).toBe(0)
    rerender(90)
    expect(result.current.timeLimitElapsedSec).toBe(90)
  })

  it('starts at 0:00 when picked while the video plays', () => {
    const { result, rerender } = setup(300)
    expect(result.current.timeLimitElapsedSec).toBe(null)
    act(() => result.current.setStopAfterMin(20))
    expect(result.current.timeLimitElapsedSec).toBe(0)
    rerender(360)
    expect(result.current.timeLimitElapsedSec).toBe(60)
  })

  it('keeps counting when the physio changes a set limit', () => {
    const { result, rerender } = setup(300)
    act(() => result.current.setStopAfterMin(20))
    rerender(1020)
    act(() => result.current.setStopAfterMin(30))
    expect(result.current.stopAfterMin).toBe(30)
    expect(result.current.timeLimitElapsedSec).toBe(720)
  })

  it('restarts at 0:00 when a cleared limit is picked again', () => {
    const { result, rerender } = setup(300)
    act(() => result.current.setStopAfterMin(20))
    rerender(600)
    act(() => result.current.setStopAfterMin(null))
    expect(result.current.timeLimitElapsedSec).toBe(null)
    rerender(700)
    act(() => result.current.setStopAfterMin(10))
    expect(result.current.timeLimitElapsedSec).toBe(0)
  })

  it('counts the next session from its play command', () => {
    const { result, rerender } = setup(300)
    act(() => result.current.setStopAfterMin(20))
    rerender(null)
    rerender(0)
    expect(result.current.stopAfterMin).toBe(20)
    expect(result.current.timeLimitElapsedSec).toBe(0)
    rerender(45)
    expect(result.current.timeLimitElapsedSec).toBe(45)
  })
})
