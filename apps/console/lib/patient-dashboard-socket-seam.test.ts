import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

describe('patient dashboard session launch seam', () => {
  it('enters launching state before VR acknowledges start', () => {
    const controlPanelSource = readConsoleFile(
      'app/(app)/patients/[patientId]/patient-dashboard/_components/control-panel.tsx',
    )

    expect(controlPanelSource).toMatch(/setProgramState\('launching'\)/)
    expect(controlPanelSource).toMatch(/isProgramLaunching/)
    expect(controlPanelSource).toMatch(/isProgramLaunching \|\|/)
  })

  it('persists started sessions on StartAck via startFromAck', () => {
    const socketSetupSource = readConsoleFile(
      'hooks/use-patient-dashboard-socket-setup.tsx',
    )

    expect(socketSetupSource).toMatch(/buildStartAckPersistenceInput/)
    expect(socketSetupSource).toMatch(/startPatientSessionFromAck/)
    expect(socketSetupSource).toMatch(/handlePersistenceFailureAfterStartAck/)
    expect(socketSetupSource).toMatch(/PROGRAM_EVENT\.End/)
    expect(socketSetupSource).toMatch(
      /resolveProgramStateAfterStartAckPersistenceFailure/,
    )
    expect(socketSetupSource).toMatch(/canPersistSessionProgress/)
    expect(socketSetupSource).toMatch(/syncSessionWorkingCopy/)
    expect(socketSetupSource).toMatch(/shouldPersistSessionWorkingCopy/)
  })

  it('keeps last used program as convenience state on the dashboard', () => {
    const stateSource = readConsoleFile('hooks/use-patient-dashboard-state.tsx')
    const selectorSource = readConsoleFile(
      'app/(app)/patients/[patientId]/patient-dashboard/_components/program-selector.tsx',
    )

    expect(stateSource).toMatch(/resolveLastUsedProgram/)
    expect(stateSource).toMatch(/patientLocalData\.lastProgram/)
    expect(selectorSource).toMatch(/orderProgramsForDashboardSelection/)
    expect(selectorSource).toMatch(/lastProgram/)
  })

  it('gates Start and Warmup on headset presence separate from console connection', () => {
    const controlPanelSource = readConsoleFile(
      'app/(app)/patients/[patientId]/patient-dashboard/_components/control-panel.tsx',
    )
    const treatmentLaunchSource = readConsoleFile(
      'lib/patient-dashboard-treatment-launch.ts',
    )

    expect(controlPanelSource).toMatch(/useVrHeadsetPresence/)
    expect(controlPanelSource).toMatch(/canLaunchTreatment/)
    expect(controlPanelSource).toMatch(/getTreatmentLaunchError/)
    expect(controlPanelSource).toMatch(/treatmentLaunchReady/)
    expect(treatmentLaunchSource).toMatch(
      /Waiting for the VR headset to connect\./,
    )
  })
})
