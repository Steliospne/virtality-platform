import { describe, expect, it } from 'vitest'
import {
  canLaunchTreatment,
  getTreatmentLaunchError,
  TREATMENT_LAUNCH_ERROR,
} from './patient-dashboard-treatment-launch.js'

describe('patient dashboard treatment launch gating', () => {
  it('blocks Start and Warmup when only the console is connected', () => {
    expect(
      canLaunchTreatment({
        consoleConnected: true,
        headsetPresent: false,
        entitlementAllowsLaunch: true,
      }),
    ).toBe(false)
  })

  it('allows Start and Warmup after the room is complete', () => {
    expect(
      canLaunchTreatment({
        consoleConnected: true,
        headsetPresent: true,
        entitlementAllowsLaunch: true,
      }),
    ).toBe(true)
  })

  it('blocks launch when the console is not connected', () => {
    expect(
      canLaunchTreatment({
        consoleConnected: false,
        headsetPresent: true,
        entitlementAllowsLaunch: true,
      }),
    ).toBe(false)
    expect(
      canLaunchTreatment({
        consoleConnected: false,
        headsetPresent: false,
        entitlementAllowsLaunch: true,
      }),
    ).toBe(false)
  })

  it('blocks launch when Remaining Time entitlement is expired', () => {
    expect(
      canLaunchTreatment({
        consoleConnected: true,
        headsetPresent: true,
        entitlementAllowsLaunch: false,
      }),
    ).toBe(false)
  })
})

describe('getTreatmentLaunchError', () => {
  it('reports entitlement expiry before connection errors', () => {
    expect(
      getTreatmentLaunchError({
        consoleConnected: false,
        headsetPresent: false,
        entitlementAllowsLaunch: false,
      }),
    ).toBe(TREATMENT_LAUNCH_ERROR.entitlementExpired)
  })

  it('reports console disconnection before headset absence', () => {
    expect(
      getTreatmentLaunchError({
        consoleConnected: false,
        headsetPresent: false,
        entitlementAllowsLaunch: true,
      }),
    ).toBe(TREATMENT_LAUNCH_ERROR.consoleDisconnected)
  })

  it('reports headset absence when the console is connected', () => {
    expect(
      getTreatmentLaunchError({
        consoleConnected: true,
        headsetPresent: false,
        entitlementAllowsLaunch: true,
      }),
    ).toBe(TREATMENT_LAUNCH_ERROR.headsetAbsent)
  })

  it('returns null when launch is ready', () => {
    expect(
      getTreatmentLaunchError({
        consoleConnected: true,
        headsetPresent: true,
        entitlementAllowsLaunch: true,
      }),
    ).toBeNull()
  })
})
