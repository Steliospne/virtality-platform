import { EventEmitter } from 'node:events'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SceneSettings from './control-panel-scene-settings'

vi.mock('./map-selector', () => ({ default: () => <div>Map selector</div> }))
vi.mock('./avatar-selector', () => ({
  default: () => <div>Avatar selector</div>,
}))
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function props(): ComponentProps<typeof SceneSettings> {
  return {
    missingSettings: false,
    selectedDevice: null,
    coachEnabled: true,
    onCoachEnabledChange: vi.fn(),
    coachToggleDisabled: false,
  }
}

describe('scene settings coach toggle', () => {
  it('renders alongside Sitting and retains the controlled value after reopening', () => {
    const settings = props()
    const { rerender } = render(<SceneSettings {...settings} />)
    fireEvent.click(screen.getByRole('button', { name: 'Scene Settings' }))
    expect(screen.getByRole('switch', { name: 'Coach' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Sitting' })).not.toBeChecked()
    fireEvent.click(screen.getByRole('switch', { name: 'Coach' }))
    expect(settings.onCoachEnabledChange).toHaveBeenCalledExactlyOnceWith(false)
    rerender(<SceneSettings {...settings} coachEnabled={false} />)
    fireEvent.keyDown(screen.getByRole('switch', { name: 'Coach' }), {
      key: 'Escape',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Scene Settings' }))
    expect(screen.getByRole('switch', { name: 'Coach' })).not.toBeChecked()
    expect(screen.getByText('Avatar selector')).toBeInTheDocument()
    expect(screen.getByText('Map selector')).toBeInTheDocument()
  })

  it('disables only Coach when coach changes are blocked', () => {
    const settings = props()
    render(<SceneSettings {...settings} coachToggleDisabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Scene Settings' }))
    const coach = screen.getByRole('switch', { name: 'Coach' })
    expect(coach).toBeDisabled()
    fireEvent.click(coach)
    expect(settings.onCoachEnabledChange).not.toHaveBeenCalled()
    expect(screen.getByRole('switch', { name: 'Sitting' })).toBeEnabled()
  })

  it('preserves Sitting acknowledgement and calibration controls', () => {
    const socket = new EventEmitter()
    const program = {
      SittingChange: vi.fn(),
      CalibrateHeight: vi.fn(),
      ResetPosition: vi.fn(),
    }
    const settings = props()
    settings.selectedDevice = {
      socket,
      events: { program },
    } as unknown as ComponentProps<typeof SceneSettings>['selectedDevice']
    render(<SceneSettings {...settings} />)
    fireEvent.click(screen.getByRole('button', { name: 'Scene Settings' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Sitting' }))
    expect(program.SittingChange).toHaveBeenCalledExactlyOnceWith(true)
    act(() => {
      socket.emit('onSittingChangeAck')
    })
    expect(screen.getByRole('switch', { name: 'Sitting' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Coach' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Reset Height' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset Position' }))
    expect(program.CalibrateHeight).toHaveBeenCalledOnce()
    expect(program.ResetPosition).toHaveBeenCalledOnce()
    expect(settings.onCoachEnabledChange).not.toHaveBeenCalled()
  })
})
