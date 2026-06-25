import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CATALOG_FIRST_AUTHORING_STEPS } from './catalog-first-authoring-flow.js'
import {
  LEGACY_LIBRARY_ACCESS_DISABLED,
  LEGACY_LIBRARY_ACCESS_DISABLED_ON_CATALOG_FIRST_SELECTED_LIST,
  QUICKSTART_DIALOG_PATH,
  REUSABLE_PROGRAM_CREATE_FLOW_PATH,
  REUSABLE_PROGRAM_CREATE_FORM_PATH,
  REUSABLE_PROGRAM_EDIT_FORM_PATH,
} from './catalog-first-authoring-surface-seams.js'
import { CATALOG_FIRST_AUTHORING_MANUAL_QA } from './catalog-first-authoring-manual-qa.js'
import { canSubmitReusableProgram } from './program-library-submit.js'
import { canQuickStartFinalAction } from './quickstart-authoring-flow.js'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

type CatalogFirstFlowSurface = {
  readonly id: string
  readonly path: string
  readonly catalogStepPattern: RegExp
  readonly selectedListPattern: RegExp
  readonly legacyLibraryHidden: RegExp
  readonly flowMarker?: RegExp
  readonly seedPattern?: RegExp
  readonly requiresCanGoToSelectedList?: boolean
  readonly companionPath?: string
  readonly companionPatterns?: readonly RegExp[]
}

const CATALOG_FIRST_FLOW_SURFACES: readonly CatalogFirstFlowSurface[] = [
  {
    id: 'quick-start',
    path: QUICKSTART_DIALOG_PATH,
    catalogStepPattern: /isCatalogStep/,
    selectedListPattern: /isSelectedListStep/,
    legacyLibraryHidden: LEGACY_LIBRARY_ACCESS_DISABLED,
    requiresCanGoToSelectedList: false,
  },
  {
    id: 'scratch-create',
    path: REUSABLE_PROGRAM_CREATE_FORM_PATH,
    catalogStepPattern: /isCatalogFirstCatalogStep/,
    selectedListPattern: /isCatalogFirstSelectedListStep/,
    flowMarker: /editorSource\.kind === 'scratch'/,
    legacyLibraryHidden:
      LEGACY_LIBRARY_ACCESS_DISABLED_ON_CATALOG_FIRST_SELECTED_LIST,
  },
  {
    id: 'starter-template-create',
    path: REUSABLE_PROGRAM_CREATE_FORM_PATH,
    catalogStepPattern: /isCatalogFirstCatalogStep/,
    selectedListPattern: /isCatalogFirstSelectedListStep/,
    flowMarker: /editorSource\.kind === 'template'/,
    legacyLibraryHidden:
      LEGACY_LIBRARY_ACCESS_DISABLED_ON_CATALOG_FIRST_SELECTED_LIST,
    seedPattern: /starterTemplateCatalogSelection/,
    companionPath: REUSABLE_PROGRAM_CREATE_FLOW_PATH,
    companionPatterns: [/StarterTemplatePicker/, /setStep\('editor'\)/],
  },
  {
    id: 'reusable-program-edit',
    path: REUSABLE_PROGRAM_EDIT_FORM_PATH,
    catalogStepPattern: /isCatalogStep/,
    selectedListPattern: /isSelectedListStep/,
    legacyLibraryHidden: LEGACY_LIBRARY_ACCESS_DISABLED,
    seedPattern: /reusableProgramExercisesForCatalogSeed/,
  },
]

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

function expectCatalogFirstAuthoringHook(
  source: string,
  {
    requiresCanGoToSelectedList = true,
  }: { requiresCanGoToSelectedList?: boolean } = {},
) {
  expect(source).toMatch(/useCatalogFirstAuthoringFlow/)
  expect(source).toMatch(/goToSelectedList/)
  expect(source).toMatch(/goToCatalog/)
  expect(source).toMatch(/selectedExerciseCountLabel/)
  if (requiresCanGoToSelectedList) {
    expect(source).toMatch(/canGoToSelectedList/)
  }
}

function expectCatalogBeforeSelectedList(source: string) {
  expect(source).toMatch(/<ExerciseGrid/)
  expect(source.indexOf('<ExerciseGrid')).toBeLessThan(
    source.indexOf('<ExerciseLibraryList'),
  )
}

function expectNoLegacyExerciseLibraryPath(source: string) {
  expect(source).not.toMatch(/ExerciseLibraryDialog/)
  expect(source).not.toMatch(/showExerciseLibraryAccess=\{true\}/)
}

describe('catalog-first authoring rollout seam', () => {
  it('defines the shared catalog then selected-list step order', () => {
    expect(CATALOG_FIRST_AUTHORING_STEPS).toEqual(['catalog', 'selected-list'])
  })

  for (const flow of CATALOG_FIRST_FLOW_SURFACES) {
    describe(flow.id, () => {
      const source = readConsoleFile(flow.path)

      it('wires the shared catalog-first authoring hook', () => {
        expectCatalogFirstAuthoringHook(source, {
          requiresCanGoToSelectedList: flow.requiresCanGoToSelectedList ?? true,
        })
        if (flow.flowMarker) {
          expect(source).toMatch(flow.flowMarker)
        }
      })

      it('opens on the catalog step with ExerciseGrid before selected-list', () => {
        expect(source).toMatch(flow.catalogStepPattern)
        expect(source).toMatch(flow.selectedListPattern)
        expectCatalogBeforeSelectedList(source)
      })

      it('hides the legacy exercise library access on selected-list', () => {
        expect(source).toMatch(flow.legacyLibraryHidden)
      })

      it('does not expose the nested exercise library dialog path', () => {
        expectNoLegacyExerciseLibraryPath(source)
      })

      const seedPattern = flow.seedPattern
      if (seedPattern) {
        it('seeds catalog selection when the flow opens', () => {
          expect(source).toMatch(seedPattern)
        })
      }

      const companionPath = flow.companionPath
      if (companionPath) {
        const companionPatterns = flow.companionPatterns ?? []
        it('routes through prerequisite steps before the catalog editor', () => {
          const companionSource = readConsoleFile(companionPath)
          for (const pattern of companionPatterns) {
            expect(companionSource).toMatch(pattern)
          }
        })
      }
    })
  }

  it('blocks reusable program submit when no enabled variants remain', () => {
    expect(canSubmitReusableProgram('Test program', [], [])).toEqual({
      ok: false,
      reason: 'exercises',
    })
  })

  it('blocks quick start final actions when no enabled variants remain', () => {
    expect(canQuickStartFinalAction([], [])).toBe(false)
  })
})

describe('catalog-first authoring manual QA coverage', () => {
  it('documents manual QA for all target flows', () => {
    const qaFlowIds = CATALOG_FIRST_AUTHORING_MANUAL_QA.map((flow) => flow.id)
    const targetFlowIds = CATALOG_FIRST_FLOW_SURFACES.map((flow) => flow.id)

    expect(qaFlowIds).toEqual(targetFlowIds)
    for (const flow of CATALOG_FIRST_AUTHORING_MANUAL_QA) {
      expect(flow.entry.length).toBeGreaterThan(0)
      expect(flow.checks.length).toBeGreaterThanOrEqual(4)
    }
  })
})
