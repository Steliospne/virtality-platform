import { describe, expect, it } from 'vitest'
import {
  PATIENT_DASHBOARD_PATH,
  QUICKSTART_DIALOG_PATH,
  readConsoleFile,
} from './catalog-first-authoring-surface-seams.js'

describe('quick start dialog surfaces', () => {
  const source = readConsoleFile(QUICKSTART_DIALOG_PATH)
  const dashboardSource = readConsoleFile(PATIENT_DASHBOARD_PATH)

  it('uses the shared catalog-first authoring flow', () => {
    expect(source).toMatch(/useCatalogFirstAuthoringFlow/)
    expect(source).toMatch(/isCatalogStep/)
    expect(source).toMatch(/isSelectedListStep/)
    expect(source).toMatch(/goToSelectedList/)
    expect(source).toMatch(/goToCatalog/)
  })

  it('shows the exercise catalog on the first step', () => {
    expect(source).toMatch(/<ExerciseGrid/)
  })

  it('shows selected-list settings without the legacy library button on the second step', () => {
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

  it('renders catalog before selected-list in the single-dialog step order', () => {
    expect(source).toMatch(/isCatalogStep\s*\?[\s\S]*?<ExerciseGrid/)
    expect(source).toMatch(/:\s*\([\s\S]*?<ExerciseLibraryList/)
  })

  it('shows selected exercise count and allows next with zero selections', () => {
    expect(source).toMatch(
      /selectedExerciseCountLabel\(selectedExercises\.length\)/,
    )
    expect(source).toMatch(/onClick=\{goToSelectedList\}/)
    expect(source).not.toMatch(
      /selectedExercises\.length === 0[\s\S]*?goToSelectedList/,
    )
  })

  it('preserves exercise library selection when navigating back to catalog', () => {
    const backButtonBlock =
      source.match(/onClick=\{goToCatalog\}[\s\S]*?<\/Button>/)?.[0] ?? ''

    expect(backButtonBlock).not.toMatch(/updateExercises/)
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
})
