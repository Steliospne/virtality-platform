import { describe, expect, it } from 'vitest'
import { canSubmitReusableProgram } from './program-library-submit.js'
import {
  REUSABLE_PROGRAM_CREATE_FLOW_PATH,
  REUSABLE_PROGRAM_CREATE_FORM_PATH,
  readConsoleFile,
} from './catalog-first-authoring-surface-seams.js'

describe('starter template catalog-first create flow', () => {
  const createFlowSource = readConsoleFile(REUSABLE_PROGRAM_CREATE_FLOW_PATH)
  const formSource = readConsoleFile(REUSABLE_PROGRAM_CREATE_FORM_PATH)

  it('routes template creation through template picker then the editor', () => {
    expect(createFlowSource).toMatch(/StarterTemplatePicker/)
    expect(createFlowSource).toMatch(/setStep\('template-picker'\)/)
    expect(createFlowSource).toMatch(/setStep\('editor'\)/)
    expect(createFlowSource).toMatch(/kind: 'template'/)
  })

  it('wires starter template creation through the catalog-first authoring hook', () => {
    expect(formSource).toMatch(/useCatalogFirstAuthoringFlow/)
    expect(formSource).toMatch(/editorSource\.kind === 'template'/)
  })

  it('opens starter template creation on the exercise catalog step', () => {
    expect(formSource).toMatch(/isCatalogFirstCatalogStep/)
    expect(formSource).toMatch(/<ExerciseGrid/)
  })

  it('seeds template exercises into catalog selection when the editor opens', () => {
    expect(formSource).toMatch(/starterTemplateCatalogSelection/)
    expect(formSource).toMatch(
      /updateExercises\(withRom\(catalogSelection\.selectedExercises\)\)/,
    )
  })

  it('shows selected exercise count near the catalog Next action for templates', () => {
    expect(formSource).toMatch(/selectedExerciseCountLabel/)
    expect(formSource).toMatch(/goToSelectedList/)
  })

  it('shows the suggested template name only on the selected-list step', () => {
    expect(formSource).toMatch(/suggestedProgramNameFromTemplate/)
    expect(formSource).toMatch(/showProgramNameField/)

    const catalogStepBlock =
      formSource.match(
        /if \(isCatalogFirstCatalogStep\) \{[\s\S]*?\n  \}/,
      )?.[0] ?? ''

    expect(catalogStepBlock).not.toMatch(/<FormField/)
    expect(catalogStepBlock).not.toMatch(/name=['"]name['"]/)
    expect(catalogStepBlock).toMatch(/Build from starter template/)
  })

  it('uses selected-list settings without the legacy exercise library access', () => {
    expect(formSource).toMatch(/isCatalogFirstSelectedListStep/)
    expect(formSource).toMatch(
      /showExerciseLibraryAccess=\{!isCatalogFirstSelectedListStep\}/,
    )
    expect(formSource).toMatch(/goToCatalog/)
  })

  it('returns from selected-list to catalog while preserving template selection', () => {
    expect(formSource).toMatch(
      /isCatalogFirstSelectedListStep[\s\S]*goToCatalog/,
    )
  })

  it('blocks final submit when no enabled exercise variants remain', () => {
    expect(formSource).toMatch(/canSubmitReusableProgram/)
    expect(formSource).toMatch(/ZERO_ENABLED_VARIANTS_MESSAGE/)

    expect(canSubmitReusableProgram('Template program', [], [])).toEqual({
      ok: false,
      reason: 'exercises',
    })
  })
})
