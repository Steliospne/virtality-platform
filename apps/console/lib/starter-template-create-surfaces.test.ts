import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { canSubmitReusableProgram } from './program-library-submit.js'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

const CREATE_FLOW_PATH =
  'app/(app)/programs/new/_components/reusable-program-create-flow.tsx'
const CREATE_FORM_PATH =
  'app/(app)/programs/new/_components/reusable-program-form.tsx'

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

describe('starter template catalog-first create flow', () => {
  const createFlowSource = readConsoleFile(CREATE_FLOW_PATH)
  const formSource = readConsoleFile(CREATE_FORM_PATH)

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
    expect(formSource).toMatch(/canGoToSelectedList/)
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
