import { describe, expect, it } from 'vitest'
import { canSubmitReusableProgram } from './program-library-submit.js'
import {
  REUSABLE_PROGRAM_CREATE_FORM_PATH,
  readConsoleFile,
} from './catalog-first-authoring-surface-seams.js'

describe('scratch reusable program settings-first create flow', () => {
  const formSource = readConsoleFile(REUSABLE_PROGRAM_CREATE_FORM_PATH)

  it('wires scratch creation through the settings-first authoring hook', () => {
    expect(formSource).toMatch(/useCatalogFirstAuthoringFlow/)
    expect(formSource).toMatch(/editorSource\.kind === 'scratch'/)
  })

  it('opens scratch creation on the exercise catalog step', () => {
    expect(formSource).toMatch(
      /isScratch[\s\S]*?initialStep:\s*CATALOG_CATALOG_FIRST_AUTHORING_STEP/,
    )
    expect(formSource).toMatch(/isCatalogFirstCatalogStep/)
    expect(formSource).toMatch(/<ExerciseGrid/)
    expect(formSource).toMatch(/goToSelectedList/)
  })

  it('shows selected exercise count near the catalog Done action', () => {
    expect(formSource).toMatch(/selectedExerciseCountLabel/)
    expect(formSource).toMatch(/goToSelectedList/)
    expect(formSource).toMatch(/>\s*Done\s*</)
  })

  it('renders the program name field only on the selected-list step', () => {
    const settingsStepBlock =
      formSource.match(
        /if \(isCatalogFirstSelectedListStep\) \{[\s\S]*?\n  \}/,
      )?.[0] ?? ''
    const catalogHeadingBlock =
      formSource.match(/const catalogCopy =[\s\S]*?return \(/)?.[0] ?? ''

    expect(formSource).toMatch(/showProgramNameField/)
    expect(settingsStepBlock).toMatch(
      /showProgramNameField[\s\S]*<FormField[\s\S]*name=['"]name['"]/,
    )
    expect(catalogHeadingBlock).not.toMatch(/<FormField/)
    expect(catalogHeadingBlock).not.toMatch(/name=['"]name['"]/)
  })

  it('uses selected-list settings without the legacy exercise library access', () => {
    expect(formSource).toMatch(/isCatalogFirstCreate/)
    expect(formSource).toMatch(/isCatalogFirstSelectedListStep/)
    expect(formSource).toMatch(
      /<ExerciseLibraryList[\s\S]*?showExerciseLibraryAccess=\{false\}/,
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
