import { describe, expect, it } from 'vitest'
import { resolveHeadsetPresentFromDeviceStatus } from './vr-headset-presence.js'

describe('resolveHeadsetPresentFromDeviceStatus', () => {
  it('treats active device status as headset present', () => {
    expect(resolveHeadsetPresentFromDeviceStatus('active')).toBe(true)
  })

  it('treats inactive device status as headset absent', () => {
    expect(resolveHeadsetPresentFromDeviceStatus('inactive')).toBe(false)
  })
})
