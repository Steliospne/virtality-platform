import { describe, expect, it } from 'vitest'
import {
  AUTO_LAUNCH_GAVE_UP,
  autoLaunchClockRunning,
  buildLaunchHref,
  parseLaunchIntent,
  resolveAutoLaunchGaveUpMessage,
  resolveAutoLaunchStep,
  type AutoLaunchGate,
} from './patient-dashboard-auto-launch'

const ready: AutoLaunchGate = {
  selectedMode: 'main',
  inQuickStart: false,
  exerciseCount: 4,
  treatmentLaunchReady: true,
  missingSettings: false,
  programState: 'ready',
}

describe('launch intent in the URL', () => {
  it('round-trips through the href', () => {
    const href = buildLaunchHref('p1', { launch: true, quickStart: true })
    expect(href).toBe('/patients/p1/patient-dashboard?launch=1&quickstart=1')
    expect(parseLaunchIntent(new URL(href, 'http://x').searchParams)).toEqual({
      launch: true,
      quickStart: true,
    })
  })

  it('omits the query when nothing is intended', () => {
    expect(buildLaunchHref('p1', { launch: false, quickStart: false })).toBe(
      '/patients/p1/patient-dashboard',
    )
    expect(parseLaunchIntent(new URLSearchParams())).toEqual({
      launch: false,
      quickStart: false,
    })
  })
})

describe('resolveAutoLaunchStep', () => {
  it('launches only when every manual-Start precondition holds', () => {
    expect(resolveAutoLaunchStep(ready)).toBe('launch')
  })

  it.each<[string, Partial<AutoLaunchGate>]>([
    ['the headset is not ready', { treatmentLaunchReady: false }],
    ['Quick Start is still open', { inQuickStart: true }],
    ['no exercises are selected yet', { exerciseCount: 0 }],
    ['avatar or map is missing', { missingSettings: true }],
    ['the dashboard is not in Exercise Mode', { selectedMode: 'immersive' }],
  ])('waits while %s', (_, patch) => {
    expect(resolveAutoLaunchStep({ ...ready, ...patch })).toBe('wait')
  })

  it('aborts once the clinician has started something themselves', () => {
    expect(resolveAutoLaunchStep({ ...ready, programState: 'launching' })).toBe(
      'abort',
    )
    expect(resolveAutoLaunchStep({ ...ready, programState: 'started' })).toBe(
      'abort',
    )
  })
})

describe('giving up', () => {
  it('pauses the clock while Quick Start is open', () => {
    expect(autoLaunchClockRunning({ inQuickStart: true })).toBe(false)
    expect(autoLaunchClockRunning({ inQuickStart: false })).toBe(true)
  })

  it('explains the first blocker, preferring the manual-Start error for readiness', () => {
    expect(
      resolveAutoLaunchGaveUpMessage({ ...ready, exerciseCount: 0 }, null),
    ).toBe(AUTO_LAUNCH_GAVE_UP.noExercises)
    expect(
      resolveAutoLaunchGaveUpMessage({ ...ready, missingSettings: true }, null),
    ).toBe(AUTO_LAUNCH_GAVE_UP.missingSettings)
    expect(
      resolveAutoLaunchGaveUpMessage(
        { ...ready, treatmentLaunchReady: false },
        'Waiting for the VR headset to connect.',
      ),
    ).toBe('Waiting for the VR headset to connect.')
    expect(
      resolveAutoLaunchGaveUpMessage(
        { ...ready, treatmentLaunchReady: false },
        null,
      ),
    ).toBe(AUTO_LAUNCH_GAVE_UP.notReady)
  })
})
