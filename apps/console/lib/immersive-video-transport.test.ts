import { describe, expect, it } from 'vitest'
import {
  isImmersiveRecenterEnabled,
  isImmersiveStopEnabled,
  resolveImmersivePlayPauseControl,
  shouldShowImmersiveStop,
} from './immersive-video-transport.js'

describe('resolveImmersivePlayPauseControl', () => {
  it('plays from Idle when a ready video and commands are available', () => {
    expect(
      resolveImmersivePlayPauseControl({
        status: 'Idle',
        commandsEnabled: true,
        readySelected: true,
      }),
    ).toEqual({ icon: 'play', disabled: false, action: 'play' })
  })

  it('disables play from Idle without a ready video', () => {
    expect(
      resolveImmersivePlayPauseControl({
        status: 'Idle',
        commandsEnabled: true,
        readySelected: false,
      }).disabled,
    ).toBe(true)
  })

  it('pauses from Playing and resumes from Paused on the same control', () => {
    expect(
      resolveImmersivePlayPauseControl({
        status: 'Playing',
        commandsEnabled: true,
        readySelected: true,
      }),
    ).toEqual({ icon: 'pause', disabled: false, action: 'pause' })
    expect(
      resolveImmersivePlayPauseControl({
        status: 'Paused',
        commandsEnabled: true,
        readySelected: true,
      }),
    ).toEqual({ icon: 'play', disabled: false, action: 'pause' })
  })

  it('disables the control while Starting', () => {
    expect(
      resolveImmersivePlayPauseControl({
        status: 'Starting',
        commandsEnabled: true,
        readySelected: true,
      }),
    ).toEqual({ icon: 'play', disabled: true, action: 'play' })
  })
})

describe('immersive stop and recenter', () => {
  it('shows stop only while playing or paused', () => {
    expect(shouldShowImmersiveStop('Idle')).toBe(false)
    expect(shouldShowImmersiveStop('Starting')).toBe(false)
    expect(shouldShowImmersiveStop('Playing')).toBe(true)
    expect(shouldShowImmersiveStop('Paused')).toBe(true)
  })

  it('enables stop and recenter only while held and commands are live', () => {
    expect(
      isImmersiveStopEnabled({ status: 'Playing', commandsEnabled: true }),
    ).toBe(true)
    expect(
      isImmersiveRecenterEnabled({ status: 'Paused', commandsEnabled: true }),
    ).toBe(true)
    expect(
      isImmersiveStopEnabled({ status: 'Playing', commandsEnabled: false }),
    ).toBe(false)
  })
})
