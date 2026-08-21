import { describe, expect, it } from 'vitest'
import {
  BREAKPOINT_SPECIFIC_WIDTH_CLASS,
  PATIENT_DASHBOARD_PATH,
  QUICKSTART_DIALOG_PATH,
  readConsoleFile,
  readQuickstartCatalogGridWrapperClass,
  readQuickstartDialogContentClass,
  VIEWPORT_WIDTH_DIALOG_CLASS,
} from './catalog-first-authoring-surface-seams.js'

describe('quick start dialog surfaces', () => {
  const source = readConsoleFile(QUICKSTART_DIALOG_PATH)
  const dashboardSource = readConsoleFile(PATIENT_DASHBOARD_PATH)

  it('uses the shared settings-first authoring flow', () => {
    expect(source).toMatch(/useCatalogFirstAuthoringFlow/)
    expect(source).toMatch(/isCatalogStep/)
    expect(source).toMatch(/isSelectedListStep/)
    expect(source).toMatch(/goToSelectedList/)
    expect(source).toMatch(/goToCatalog/)
  })

  it('shows settings on the selected-list step and catalog when adding exercises', () => {
    expect(source).toMatch(/<ExerciseLibraryList/)
    expect(source).toMatch(/<ExerciseGrid/)
    expect(source).toMatch(/Add exercises/)
  })

  it('opens quick start on the exercise catalog step', () => {
    expect(source).toMatch(
      /useCatalogFirstAuthoringFlow\(\{\s*initialStep:\s*CATALOG_CATALOG_FIRST_AUTHORING_STEP/,
    )
  })

  it('allows scrolling on the catalog step so all exercises are reachable', () => {
    const catalogGridWrapper = readQuickstartCatalogGridWrapperClass(source)

    expect(catalogGridWrapper).toMatch(/overflow-auto/)
    expect(catalogGridWrapper).not.toMatch(/overflow-hidden/)
  })

  it('shows selected-list settings without the legacy library button on the first step', () => {
    expect(source).toMatch(
      /<ExerciseLibraryList[\s\S]*?showExerciseLibraryAccess=\{false\}/,
    )
  })

  it('places Continue and Save Program on the selected-list step', () => {
    expect(source).toMatch(/canQuickStartFinalAction/)
    expect(source).toMatch(/Continue/)
    expect(source).toMatch(/Save Program/)
    expect(source).not.toMatch(/Quickstart Program Overview/)
  })

  it('opens a save reminder dialog before Continue finalizes', () => {
    expect(source).toMatch(/openSavePrompt/)
    expect(source).toMatch(/Save this as a program\?/)
    expect(source).toMatch(/Continue without saving/)
    expect(source).toMatch(/quickstart_continue_save_prompt_shown/)
    expect(source).toMatch(/quickstart_continue_save_prompt_saved/)
    expect(source).toMatch(/quickstart_continue_save_prompt_dismissed/)
    expect(source).toMatch(/promptForm/)
  })

  it('renders selected-list before catalog in the single-dialog step order', () => {
    expect(source).toMatch(
      /isSelectedListStep\s*\?[\s\S]*?<ExerciseLibraryList/,
    )
    expect(source).toMatch(/:\s*\([\s\S]*?<ExerciseGrid/)
  })

  it('shows selected exercise count on the catalog step', () => {
    expect(source).toMatch(
      /selectedExerciseCountLabel\(selectedExercises\.length\)/,
    )
    expect(source).toMatch(/onClick=\{goToSelectedList\}/)
  })

  it('preserves exercise library selection when navigating to catalog and back', () => {
    const addExercisesBlock =
      source.match(/onClick=\{goToCatalog\}[\s\S]*?<\/Button>/)?.[0] ?? ''
    const doneBlock =
      source.match(/onClick=\{goToSelectedList\}[\s\S]*?<\/Button>/)?.[0] ?? ''

    expect(addExercisesBlock).not.toMatch(/updateExercises/)
    expect(doneBlock).not.toMatch(/updateExercises/)
  })

  it('does not mount the nested exercise library dialog path', () => {
    expect(source).not.toMatch(/ExerciseLibraryDialog/)
    expect(source).not.toMatch(/showExerciseLibraryAccess=\{true\}/)
  })

  it('launches quick start from the patient dashboard as a dialog', () => {
    expect(dashboardSource).toMatch(/<QuickStartDialog\s*\/>/)
    expect(source).toMatch(/<Dialog open=\{inQuickStart\}/)
    expect(dashboardSource).not.toMatch(/quickstart.*route/i)
  })

  it('sizes the dialog to at least 70% of the viewport width', () => {
    const dialogContentClass = readQuickstartDialogContentClass(source)

    expect(dialogContentClass).toMatch(VIEWPORT_WIDTH_DIALOG_CLASS)
    expect(dialogContentClass).not.toMatch(BREAKPOINT_SPECIFIC_WIDTH_CLASS)
  })
})
