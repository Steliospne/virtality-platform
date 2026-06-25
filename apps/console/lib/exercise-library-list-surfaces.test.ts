import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

const EXERCISE_LIBRARY_LIST_PATH = 'components/ui/exercise-library-list.tsx'

const LEGACY_EXERCISE_LIBRARY_LIST_CONSUMERS = [] as const

const CATALOG_FIRST_EXERCISE_LIBRARY_LIST_CONSUMERS = [
  'app/(app)/patients/[patientId]/patient-dashboard/_components/quickstart-dialog.tsx',
  'app/(app)/programs/[programId]/edit/_components/reusable-program-edit-form.tsx',
] as const

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

describe('exercise library list surfaces', () => {
  const listSource = readConsoleFile(EXERCISE_LIBRARY_LIST_PATH)

  it('can render selected-list settings without the old exercise library access', () => {
    expect(listSource).toMatch(/showExerciseLibraryAccess\s*=\s*true/)
    expect(listSource).toMatch(
      /showExerciseLibraryAccess\s*&&\s*\([\s\S]*?Exercise library/,
    )
    expect(listSource).toMatch(
      /showExerciseLibraryAccess\s*&&\s*<ExerciseLibraryDialog/,
    )
  })

  it('keeps legacy flows on the old library button and dialog by default', () => {
    for (const path of LEGACY_EXERCISE_LIBRARY_LIST_CONSUMERS) {
      const source = readConsoleFile(path)
      expect(source).toMatch(/<ExerciseLibraryList/)
      expect(source).not.toMatch(/showExerciseLibraryAccess=\{false\}/)
    }
  })

  it('hides legacy exercise library access on catalog-first selected-list', () => {
    const createFormSource = readConsoleFile(
      'app/(app)/programs/new/_components/reusable-program-form.tsx',
    )

    expect(createFormSource).toMatch(/isCatalogFirstCreate/)
    expect(createFormSource).toMatch(/isCatalogFirstSelectedListStep/)
    expect(createFormSource).toMatch(
      /showExerciseLibraryAccess=\{!isCatalogFirstSelectedListStep\}/,
    )
  })

  it('hides the legacy library button for catalog-first quick start', () => {
    for (const path of CATALOG_FIRST_EXERCISE_LIBRARY_LIST_CONSUMERS) {
      const source = readConsoleFile(path)
      expect(source).toMatch(
        /<ExerciseLibraryList[\s\S]*?showExerciseLibraryAccess=\{false\}/,
      )
    }
  })

  it('keeps selected-list settings handlers in the component source', () => {
    expect(listSource).toMatch(/reorderSegmentGroups/)
    expect(listSource).toMatch(/deleteSelected/)
    expect(listSource).toMatch(/checkAll/)
    expect(listSource).toMatch(/toggleProgramDirection/)
    expect(listSource).toMatch(/ExerciseSettings/)
    expect(listSource).toMatch(/markDeferredRemoval/)
    expect(listSource).toMatch(/unmarkDeferredRemoval/)
    expect(listSource).toMatch(
      /segmentProgramExerciseRowsByAdjacentBilateralFamilies/,
    )
  })
})
