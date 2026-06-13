import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const consoleRoot = fileURLToPath(new URL('..', import.meta.url))

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8')
}

function readConsoleFile(relativePath: string): string {
  return readFileSync(join(consoleRoot, relativePath), 'utf8')
}

const LEGACY_HOOK_NAMES = [
  'usePatientProgram',
  'usePatientPrograms',
  'usePreset',
  'usePresets',
  'usePresetsByUser',
  'useCreateProgram',
  'useUpdateProgram',
  'useDeleteProgram',
  'useCreatePreset',
  'useUpdatePreset',
  'useDeletePreset',
]

describe('clinician API vocabulary cleanup', () => {
  it('does not export legacy patient-program or preset hooks from the main react-query entry', () => {
    const queryExports = readRepoFile(
      'packages/react-query/src/hooks/queries/index.ts',
    )
    const mutationExports = readRepoFile(
      'packages/react-query/src/hooks/mutations/index.ts',
    )
    const mainIndex = readRepoFile('packages/react-query/src/index.ts')

    for (const hookName of LEGACY_HOOK_NAMES) {
      expect(queryExports).not.toMatch(new RegExp(`export \\{ ${hookName}`))
      expect(mutationExports).not.toMatch(new RegExp(`export \\{ ${hookName}`))
      expect(mainIndex).not.toMatch(new RegExp(`export \\{ ${hookName}`))
    }
  })

  it('keeps legacy hooks available from the react-query legacy entry', () => {
    const legacyIndex = readRepoFile('packages/react-query/src/legacy/index.ts')

    for (const hookName of LEGACY_HOOK_NAMES) {
      expect(legacyIndex).toMatch(new RegExp(hookName))
    }
  })

  it('does not reference legacy hooks anywhere in the console app source', () => {
    const appSource = readConsoleFile('app/(app)/programs/page.tsx')
    const dashboardSource = readConsoleFile(
      'app/(app)/patients/[patientId]/patient-dashboard/_components/program-selector.tsx',
    )

    for (const source of [appSource, dashboardSource]) {
      for (const hookName of LEGACY_HOOK_NAMES) {
        expect(source).not.toMatch(new RegExp(hookName))
      }
    }
  })

  it('removes unused preset and patient-program form types from console definitions', () => {
    const definitionsSource = readConsoleFile('lib/definitions.ts')
    const modelsSource = readConsoleFile('types/models.ts')

    expect(definitionsSource).not.toMatch(/PresetFormSchema/)
    expect(modelsSource).not.toMatch(/CompletePatientProgram/)
    expect(modelsSource).not.toMatch(/PresetWithExercises/)
  })
})
