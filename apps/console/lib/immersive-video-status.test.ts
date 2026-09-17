import { describe, expect, it } from 'vitest'
import {
  formatSessionTimer,
  isImmersiveSessionActive,
  shouldShowImmersivePlaybackBar,
} from './immersive-video-status.js'

describe('shouldShowImmersivePlaybackBar', () => {
  it('shows the bar only while the headset reports playback', () => {
    expect(shouldShowImmersivePlaybackBar('Idle')).toBe(false)
    expect(shouldShowImmersivePlaybackBar('Starting')).toBe(false)
    expect(shouldShowImmersivePlaybackBar('Playing')).toBe(true)
    expect(shouldShowImmersivePlaybackBar('Paused')).toBe(true)
  })
})

describe('isImmersiveSessionActive', () => {
  it('counts every status but Idle as an active session', () => {
    expect(isImmersiveSessionActive('Idle')).toBe(false)
    expect(isImmersiveSessionActive('Starting')).toBe(true)
    expect(isImmersiveSessionActive('Playing')).toBe(true)
    expect(isImmersiveSessionActive('Paused')).toBe(true)
  })
})

describe('formatSessionTimer', () => {
  it('formats minutes and seconds under an hour', () => {
    expect(formatSessionTimer(0)).toBe('0:00')
    expect(formatSessionTimer(65)).toBe('1:05')
    expect(formatSessionTimer(3599)).toBe('59:59')
  })

  it('adds an hours field past an hour', () => {
    expect(formatSessionTimer(3600)).toBe('1:00:00')
    expect(formatSessionTimer(3725)).toBe('1:02:05')
  })

  it('never goes negative', () => {
    expect(formatSessionTimer(-5)).toBe('0:00')
  })
})
