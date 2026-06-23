import { describe, expect, it } from 'vitest'
import {
  canLaunchTreatment,
  resolveHeadsetPresentFromDeviceStatus,
} from './patient-dashboard-treatment-launch.js'

describe('patient dashboard treatment launch gating', () => {
  it('blocks Start and Warmup when only the console is connected', () => {
    expect(
      canLaunchTreatment({
        consoleConnected: true,
        headsetPresent: false,
      }),
    ).toBe(false)
  })

  it('allows Start and Warmup after the room is complete', () => {
    expect(
      canLaunchTreatment({
        consoleConnected: true,
        headsetPresent: true,
      }),
    ).toBe(true)
  })

  it('blocks launch when the console is not connected', () => {
    expect(
      canLaunchTreatment({
        consoleConnected: false,
        headsetPresent: true,
      }),
    ).toBe(false)
    expect(
      canLaunchTreatment({
        consoleConnected: false,
        headsetPresent: false,
      }),
    ).toBe(false)
  })
})

describe('resolveHeadsetPresentFromDeviceStatus', () => {
  it('treats active device status as headset present', () => {
    expect(resolveHeadsetPresentFromDeviceStatus('active')).toBe(true)
  })

  it('treats inactive device status as headset absent', () => {
    expect(resolveHeadsetPresentFromDeviceStatus('inactive')).toBe(false)
  })
})
