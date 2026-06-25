import { describe, expect, it } from 'vitest'
import { canSubmitReusableProgram } from './program-library-submit.js'
import {
  REUSABLE_PROGRAM_EDIT_FORM_PATH,
  readConsoleFile,
} from './catalog-first-authoring-surface-seams.js'

describe('reusable program catalog-first edit flow', () => {
  const formSource = readConsoleFile(REUSABLE_PROGRAM_EDIT_FORM_PATH)

  it('wires edit through the catalog-first authoring hook', () => {
    expect(formSource).toMatch(/useCatalogFirstAuthoringFlow/)
    expect(formSource).toMatch(/isCatalogStep/)
    expect(formSource).toMatch(/isSelectedListStep/)
  })

  it('opens edit on the exercise catalog with existing exercises seeded', () => {
    expect(formSource).toMatch(/<ExerciseGrid/)
    expect(formSource).toMatch(/reusableProgramExercisesForCatalogSeed/)
    expect(formSource).toMatch(/updateExercises\(withRom\(seededExercises\)\)/)
  })

  it('shows selected exercise count near the catalog Next action', () => {
    expect(formSource).toMatch(/selectedExerciseCountLabel/)
    expect(formSource).toMatch(/goToSelectedList/)
  })

  it('renders the existing program name only on the selected-list step', () => {
    const catalogStepBlock =
      formSource.match(/if \(isCatalogStep\) \{[\s\S]*?\n  \}/)?.[0] ?? ''

    expect(formSource).toMatch(/reusableProgramMetadataForEdit/)
    expect(formSource).toMatch(/showProgramNameField/)
    expect(formSource).toMatch(
      /showProgramNameField[\s\S]*<FormField[\s\S]*name=['"]name['"]/,
    )
    expect(catalogStepBlock).not.toMatch(/<FormField/)
    expect(catalogStepBlock).not.toMatch(/name=['"]name['"]/)
  })

  it('uses selected-list settings without the legacy exercise library access', () => {
    expect(formSource).toMatch(/goToCatalog/)
    expect(formSource).toMatch(
      /<ExerciseLibraryList[\s\S]*?showExerciseLibraryAccess=\{false\}/,
    )
  })

  it('blocks final update when no enabled exercise variants remain', () => {
    expect(formSource).toMatch(/canSubmitReusableProgram/)
    expect(formSource).toMatch(/ZERO_ENABLED_VARIANTS_MESSAGE/)

    expect(canSubmitReusableProgram('Shoulder rehab', [], [])).toEqual({
      ok: false,
      reason: 'exercises',
    })
  })

  it('keeps starter templates non-editable', () => {
    expect(formSource).toMatch(/isStarterTemplateProgram/)
    expect(formSource).toMatch(/Starter templates cannot be edited/)
    expect(formSource).toMatch(/router\.replace\('\/programs'\)/)
  })
})
