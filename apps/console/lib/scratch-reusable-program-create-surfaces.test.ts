import { describe, expect, it } from 'vitest'
import { canSubmitReusableProgram } from './program-library-submit.js'
import {
  REUSABLE_PROGRAM_CREATE_FORM_PATH,
  readConsoleFile,
} from './catalog-first-authoring-surface-seams.js'

describe('scratch reusable program catalog-first create flow', () => {
  const formSource = readConsoleFile(REUSABLE_PROGRAM_CREATE_FORM_PATH)

  it('wires scratch creation through the catalog-first authoring hook', () => {
    expect(formSource).toMatch(/useCatalogFirstAuthoringFlow/)
    expect(formSource).toMatch(/editorSource\.kind === 'scratch'/)
  })

  it('opens scratch creation on the exercise catalog step', () => {
    expect(formSource).toMatch(/isCatalogStep/)
    expect(formSource).toMatch(/<ExerciseGrid/)
  })

  it('shows selected exercise count near the catalog Next action', () => {
    expect(formSource).toMatch(/selectedExerciseCountLabel/)
    expect(formSource).toMatch(/goToSelectedList/)
  })

  it('renders the program name field only on the selected-list step', () => {
    const catalogStepBlock =
      formSource.match(
        /if \(isCatalogFirstCatalogStep\) \{[\s\S]*?\n  \}/,
      )?.[0] ?? ''

    expect(formSource).toMatch(/showProgramNameField/)
    expect(formSource).toMatch(
      /showProgramNameField[\s\S]*<FormField[\s\S]*name=['"]name['"]/,
    )
    expect(catalogStepBlock).not.toMatch(/<FormField/)
    expect(catalogStepBlock).not.toMatch(/name=['"]name['"]/)
  })

  it('uses selected-list settings without the legacy exercise library access', () => {
    expect(formSource).toMatch(/isCatalogFirstCreate/)
    expect(formSource).toMatch(/isCatalogFirstSelectedListStep/)
    expect(formSource).toMatch(
      /showExerciseLibraryAccess=\{!isCatalogFirstSelectedListStep\}/,
    )
    expect(formSource).toMatch(/goToCatalog/)
  })

  it('blocks final submit when no enabled exercise variants remain', () => {
    expect(formSource).toMatch(/canSubmitReusableProgram/)
    expect(formSource).toMatch(/ZERO_ENABLED_VARIANTS_MESSAGE/)

    expect(canSubmitReusableProgram('Shoulder rehab', [], [])).toEqual({
      ok: false,
      reason: 'exercises',
    })
  })
})
