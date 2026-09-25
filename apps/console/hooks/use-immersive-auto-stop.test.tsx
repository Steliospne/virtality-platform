import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useImmersiveAutoStop } from './use-immersive-auto-stop'

type Input = Parameters<typeof useImmersiveAutoStop>[0]

function input(overrides: Partial<Input> = {}): Input {
  return {
    elapsedSec: 0,
    stopAfterMin: 10,
    status: 'Playing',
    commandsEnabled: true,
    sendStop: () => {},
    ...overrides,
  }
}

afterEach(cleanup)

describe('useImmersiveAutoStop', () => {
  it('sends stop once when the limit is reached', () => {
    const sendStop = vi.fn()
    const { rerender } = renderHook(useImmersiveAutoStop, {
      initialProps: input({ elapsedSec: 599, sendStop }),
    })
    expect(sendStop).not.toHaveBeenCalled()
    rerender(input({ elapsedSec: 600, sendStop }))
    rerender(input({ elapsedSec: 601, sendStop }))
    rerender(input({ elapsedSec: 602, sendStop }))
    expect(sendStop).toHaveBeenCalledTimes(1)
  })

  it('waits for commands to come back before stopping', () => {
    const sendStop = vi.fn()
    const { rerender } = renderHook(useImmersiveAutoStop, {
      initialProps: input({
        elapsedSec: 700,
        commandsEnabled: false,
        sendStop,
      }),
    })
    expect(sendStop).not.toHaveBeenCalled()
    rerender(input({ elapsedSec: 701, sendStop }))
    expect(sendStop).toHaveBeenCalledTimes(1)
  })

  it('re-arms for the next session', () => {
    const sendStop = vi.fn()
    const { rerender } = renderHook(useImmersiveAutoStop, {
      initialProps: input({ elapsedSec: 600, sendStop }),
    })
    rerender(input({ elapsedSec: null, status: 'Idle', sendStop }))
    rerender(input({ elapsedSec: 0, sendStop }))
    expect(sendStop).toHaveBeenCalledTimes(1)
    rerender(input({ elapsedSec: 600, sendStop }))
    expect(sendStop).toHaveBeenCalledTimes(2)
  })

  it('does nothing without a limit', () => {
    const sendStop = vi.fn()
    renderHook(useImmersiveAutoStop, {
      initialProps: input({ elapsedSec: 5000, stopAfterMin: null, sendStop }),
    })
    expect(sendStop).not.toHaveBeenCalled()
  })
})
