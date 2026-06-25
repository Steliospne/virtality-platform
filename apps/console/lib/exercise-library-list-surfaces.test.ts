import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  LEGACY_LIBRARY_ACCESS_DISABLED,
  LEGACY_LIBRARY_ACCESS_DISABLED_ON_CATALOG_FIRST_SELECTED_LIST,
  QUICKSTART_DIALOG_PATH,
  REUSABLE_PROGRAM_CREATE_FORM_PATH,
  REUSABLE_PROGRAM_EDIT_FORM_PATH,
} from './catalog-first-authoring-surface-seams.js'

const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

const EXERCISE_LIBRARY_LIST_PATH = 'components/ui/exercise-library-list.tsx'

const CATALOG_FIRST_EXERCISE_LIBRARY_LIST_CONSUMERS = [
  {
    path: QUICKSTART_DIALOG_PATH,
    legacyLibraryHidden: LEGACY_LIBRARY_ACCESS_DISABLED,
  },
  {
    path: REUSABLE_PROGRAM_EDIT_FORM_PATH,
    legacyLibraryHidden: LEGACY_LIBRARY_ACCESS_DISABLED,
  },
  {
    path: REUSABLE_PROGRAM_CREATE_FORM_PATH,
    legacyLibraryHidden:
      LEGACY_LIBRARY_ACCESS_DISABLED_ON_CATALOG_FIRST_SELECTED_LIST,
  },
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

  it('hides legacy exercise library access on all catalog-first selected-list surfaces', () => {
    for (const consumer of CATALOG_FIRST_EXERCISE_LIBRARY_LIST_CONSUMERS) {
      const source = readConsoleFile(consumer.path)
      expect(source).toMatch(/<ExerciseLibraryList/)
      expect(source).toMatch(consumer.legacyLibraryHidden)
      expect(source).not.toMatch(/ExerciseLibraryDialog/)
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
