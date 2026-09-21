/** Id of the Start a session card; header button and the last step scroll to it. */
export const START_SESSION_ANCHOR = 'start-session'

export type GettingStartedInput = {
  deviceCount: number
  pairedDeviceCount: number
  patientCount: number
  programCount: number
  sessionCount: number
}

export type GettingStartedStepId = 'device' | 'patient' | 'program' | 'session'

export type GettingStartedStep = {
  id: GettingStartedStepId
  title: string
  /** What to show under the title; changes once the step is done. */
  detail: string
  done: boolean
  /** The first step that is not done. */
  current: boolean
  href: string
}

export type GettingStarted = {
  steps: GettingStartedStep[]
  doneCount: number
  /** Every step is done: the card folds away. */
  complete: boolean
}

export function buildGettingStarted(
  input: GettingStartedInput,
): GettingStarted {
  const hasPaired = input.pairedDeviceCount > 0
  const hasPatient = input.patientCount > 0
  const hasProgram = input.programCount > 0
  const hasSession = input.sessionCount > 0

  const steps: Omit<GettingStartedStep, 'current'>[] = [
    {
      id: 'device',
      title: 'Pair a headset',
      detail: hasPaired
        ? `${input.pairedDeviceCount} headset${input.pairedDeviceCount === 1 ? '' : 's'} paired`
        : input.deviceCount > 0
          ? 'A headset is added but not paired yet.'
          : 'Add a headset and pair it with the 6-digit code.',
      done: hasPaired,
      href: '/devices',
    },
    {
      id: 'patient',
      title: 'Add your first patient',
      detail: hasPatient
        ? `${input.patientCount} patient${input.patientCount === 1 ? '' : 's'} on file`
        : 'Name and basic info is enough to start.',
      done: hasPatient,
      href: hasPatient ? '/patients' : '/patients/new',
    },
    {
      id: 'program',
      title: 'Build a Reusable Program',
      detail: hasProgram
        ? `${input.programCount} program${input.programCount === 1 ? '' : 's'} in your library`
        : 'Start from a Starter Template or pick exercises yourself. Takes about 3 minutes.',
      done: hasProgram,
      href: hasProgram ? '/programs' : '/programs/new',
    },
    {
      id: 'session',
      title: 'Run a Started Session',
      detail: hasSession
        ? 'First session done'
        : 'Put the headset on the patient, pick the program, press Launch.',
      done: hasSession,
      href: `#${START_SESSION_ANCHOR}`,
    },
  ]

  const firstOpen = steps.findIndex((step) => !step.done)
  const doneCount = steps.filter((step) => step.done).length

  return {
    steps: steps.map((step, index) => ({
      ...step,
      current: index === firstOpen,
    })),
    doneCount,
    complete: firstOpen === -1,
  }
}

/** "Two steps left before your first session." */
export function gettingStartedHeadline(gettingStarted: GettingStarted): string {
  const left = gettingStarted.steps.length - gettingStarted.doneCount
  if (left === 0) return 'You are all set.'
  const words = ['One', 'Two', 'Three', 'Four']
  const word = words[left - 1] ?? String(left)
  return `${word} step${left === 1 ? '' : 's'} left before your first session.`
}
