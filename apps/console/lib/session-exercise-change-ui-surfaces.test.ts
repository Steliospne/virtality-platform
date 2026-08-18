import { describe, expect, it } from 'vitest'
import { readConsoleFile } from './catalog-first-authoring-surface-seams.js'

const CONTROL_PANEL_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/control-panel.tsx'
const CONTROL_PANEL_CONTROLS_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/control-panel-controls.tsx'
const CONTROL_PANEL_HOOK_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/use-control-panel.ts'
const EXERCISE_LIST_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/exercise-list.tsx'
const STATUS_PATH =
  'app/(app)/patients/[patientId]/patient-dashboard/_components/session-exercise-change-status.tsx'
const SOCKET_SETUP_PATH = 'hooks/use-patient-dashboard-socket-setup.tsx'

describe('session exercise change UI surfaces', () => {
  it('shows a pending status banner with headset-confirmed and target exercises', () => {
    const controlPanel = readConsoleFile(CONTROL_PANEL_PATH)
    const status = readConsoleFile(STATUS_PATH)

    expect(controlPanel).toMatch(/<SessionExerciseChangeStatus/)
    expect(controlPanel).toMatch(/pendingExerciseChange/)
    expect(status).toMatch(/resolveExerciseChangeStatusMessage/)
    expect(status).toMatch(/resolveSessionExerciseChangeStatusItemClass/)
    expect(status).toMatch(/aria-live='polite'/)
  })

  it('labels confirmed and pending exercises separately in the list', () => {
    const exerciseList = readConsoleFile(EXERCISE_LIST_PATH)

    expect(exerciseList).toMatch(/EXERCISE_LIST_HIGHLIGHT_LABEL/)
    expect(exerciseList).toMatch(/resolveExerciseListHighlightClass/)
    expect(exerciseList).toMatch(/shouldShowExerciseListHighlightBadge/)
    expect(exerciseList).toMatch(/headset-confirmed exercise/)
    expect(exerciseList).toMatch(/pending change[\s\S]*target/)
  })

  it('explains disabled skip controls and locked direct selection', () => {
    const controlPanelHook = readConsoleFile(CONTROL_PANEL_HOOK_PATH)
    const controls = readConsoleFile(CONTROL_PANEL_CONTROLS_PATH)
    const exerciseList = readConsoleFile(EXERCISE_LIST_PATH)

    expect(controlPanelHook).toMatch(/resolveSkipControlUiState/)
    expect(controls).toMatch(/SkipControlButton/)
    expect(exerciseList).toMatch(/resolveDirectSelectionBlockedTooltip/)
    expect(exerciseList).toMatch(
      /selection is locked while a change is in flight/,
    )
  })

  it('recovers from missing acknowledgement by clearing pending state', () => {
    const socketSetup = readConsoleFile(SOCKET_SETUP_PATH)

    expect(socketSetup).toMatch(/EXERCISE_CHANGE_ACK_TIMEOUT_MS/)
    expect(socketSetup).toMatch(/handlePendingExerciseChangeFailure/)
    expect(socketSetup).toMatch(/resolveExerciseChangeFailureMessage/)
    expect(socketSetup).toMatch(/clearPendingExerciseChangeTimeout/)
  })
})
